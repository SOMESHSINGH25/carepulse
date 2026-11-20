import { createHash, randomBytes } from 'node:crypto'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { getAdminFirestore } from '../config/firebaseAdmin.js'
import { containsAbusiveLanguage } from '../utils/abuseFilter.js'
import { HttpError } from '../utils/httpError.js'

const feedbackCollection = 'feedback'
const linksCollection = 'feedbackLinks'
const ratingFields = [
  'punctuality',
  'qualityOfCare',
  'hygiene',
  'behaviour',
]

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function asDate(value) {
  if (value && typeof value.toDate === 'function') {
    return value.toDate()
  }
  if (value instanceof Date) {
    return value
  }
  return value ? new Date(value) : null
}

function serializeFeedback(document) {
  const data = document.data()
  return {
    id: document.id,
    nurseName: data.nurseName,
    visitDate: data.visitDate ?? null,
    ratings: data.ratings,
    npsScore: data.npsScore,
    comment: data.abusive ? '' : data.comment,
    abusive: Boolean(data.abusive),
    synthetic: Boolean(data.synthetic),
    submittedAt: asDate(data.submittedAt)?.toISOString() ?? null,
  }
}

export async function createFeedbackLink({
  nurseName,
  visitDate = null,
  expiresInHours = 168,
}) {
  const token = randomBytes(32).toString('base64url')
  const tokenId = hashToken(token)
  const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
  const firestore = getAdminFirestore()

  await firestore.collection(linksCollection).doc(tokenId).create({
    nurseName,
    visitDate,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
    status: 'pending',
  })

  const appUrl =
    process.env.PUBLIC_APP_URL ||
    process.env.FRONTEND_URL ||
    'http://localhost:5173'

  return {
    url: `${appUrl.replace(/\/+$/, '')}/feedback/${token}`,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function getFeedbackLink(token) {
  const firestore = getAdminFirestore()
  const snapshot = await firestore
    .collection(linksCollection)
    .doc(hashToken(token))
    .get()

  if (!snapshot.exists) {
    throw new HttpError(404, 'This feedback link is invalid or has expired.')
  }

  const link = snapshot.data()
  const expiresAt = asDate(link.expiresAt)
  if (link.status !== 'pending' || !expiresAt || expiresAt <= new Date()) {
    throw new HttpError(410, 'This feedback link is no longer available.')
  }

  return {
    nurseName: link.nurseName,
    visitDate: link.visitDate ?? null,
    expiresAt: expiresAt.toISOString(),
  }
}

export async function submitFeedback(token, input) {
  const firestore = getAdminFirestore()
  const tokenId = hashToken(token)
  const linkRef = firestore.collection(linksCollection).doc(tokenId)
  const feedbackRef = firestore.collection(feedbackCollection).doc()
  const ratings = Object.fromEntries(
    ratingFields.map((field) => [field, input.ratings[field]]),
  )
  const comment = input.comment.trim()
  const abusive = containsAbusiveLanguage(comment)

  await firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(linkRef)
    if (!snapshot.exists) {
      throw new HttpError(404, 'This feedback link is invalid or has expired.')
    }

    const link = snapshot.data()
    const expiresAt = asDate(link.expiresAt)
    if (link.status !== 'pending') {
      throw new HttpError(409, 'Feedback has already been submitted for this link.')
    }
    if (!expiresAt || expiresAt <= new Date()) {
      throw new HttpError(410, 'This feedback link has expired.')
    }

    transaction.create(feedbackRef, {
      nurseName: link.nurseName,
      visitDate: link.visitDate ?? null,
      ratings,
      npsScore: input.npsScore,
      comment,
      abusive,
      synthetic: false,
      submittedAt: FieldValue.serverTimestamp(),
      feedbackLinkId: tokenId,
    })
    transaction.update(linkRef, {
      status: 'submitted',
      submittedAt: FieldValue.serverTimestamp(),
      feedbackId: feedbackRef.id,
    })
  })

  return { submitted: true }
}

export async function getAllFeedback() {
  const snapshot = await getAdminFirestore().collection(feedbackCollection).get()
  return snapshot.docs.map(serializeFeedback)
}

export async function getDashboardData({ includeFlagged = false } = {}) {
  const allFeedback = await getAllFeedback()
  const orderedFeedback = allFeedback.sort(
    (first, second) =>
      new Date(second.submittedAt ?? 0) - new Date(first.submittedAt ?? 0),
  )
  const visibleFeedback = includeFlagged
    ? orderedFeedback
    : orderedFeedback.filter((entry) => !entry.abusive)
  const average = (values) =>
    values.length
      ? Number(
          (values.reduce((total, value) => total + value, 0) / values.length).toFixed(2),
        )
      : null
  const ratingTotals = ratingFields.map((field) =>
    average(allFeedback.map((entry) => entry.ratings[field])),
  )
  const allRatings = allFeedback.flatMap((entry) =>
    ratingFields.map((field) => entry.ratings[field]),
  )
  const promoters = allFeedback.filter((entry) => entry.npsScore >= 9).length
  const detractors = allFeedback.filter((entry) => entry.npsScore <= 6).length
  const nps =
    allFeedback.length === 0
      ? null
      : Math.round(((promoters - detractors) / allFeedback.length) * 100)

  const nurseFeedback = new Map()
  for (const entry of allFeedback) {
    const nurseEntries = nurseFeedback.get(entry.nurseName) ?? []
    nurseEntries.push(entry)
    nurseFeedback.set(entry.nurseName, nurseEntries)
  }

  const nurseRatings = [...nurseFeedback.entries()]
    .map(([nurseName, entries]) => ({
      nurseName,
      averageRating: average(
        entries.flatMap((entry) =>
          ratingFields.map((field) => entry.ratings[field]),
        ),
      ),
      feedbackCount: entries.length,
    }))
    .sort((first, second) => second.averageRating - first.averageRating)

  const trendBuckets = new Map()
  for (const entry of allFeedback) {
    if (!entry.submittedAt) continue
    const date = entry.submittedAt.slice(0, 10)
    const scores = trendBuckets.get(date) ?? []
    scores.push(...ratingFields.map((field) => entry.ratings[field]))
    trendBuckets.set(date, scores)
  }
  const ratingTrends = [...trendBuckets.entries()]
    .map(([date, scores]) => ({ date, averageRating: average(scores) }))
    .sort((first, second) => first.date.localeCompare(second.date))

  const lowScoreFollowUp = visibleFeedback
    .filter((entry) => {
      const scores = ratingFields.map((field) => entry.ratings[field])
      return average(scores) <= 3 || scores.some((score) => score <= 2)
    })
    .map((entry) => ({
      ...entry,
      comment: entry.abusive
        ? '[Comment hidden by the abusive-language filter]'
        : entry.comment,
    }))

  return {
    summary: {
      feedbackCount: allFeedback.length,
      averageRating: average(allRatings),
      nps,
      flaggedCount: allFeedback.filter((entry) => entry.abusive).length,
      syntheticCount: allFeedback.filter((entry) => entry.synthetic).length,
      ratingAverages: Object.fromEntries(
        ratingFields.map((field, index) => [field, ratingTotals[index]]),
      ),
    },
    nurseRatings,
    ratingTrends,
    lowScoreFollowUp,
    recentFeedback: visibleFeedback.slice(0, 20).map((entry) => ({
      ...entry,
      comment: entry.abusive
        ? '[Comment hidden by the abusive-language filter]'
        : entry.comment,
    })),
  }
}
