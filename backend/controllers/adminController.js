import {
  createFeedbackLink,
  getAllFeedback,
  getDashboardData,
} from '../services/feedbackService.js'
import { toCsv } from '../utils/csv.js'
import { HttpError } from '../utils/httpError.js'

export async function readDashboard(request, response) {
  const includeFlagged = request.query.includeFlagged === 'true'
  response.json(await getDashboardData({ includeFlagged }))
}

export async function createLink(request, response) {
  const { nurseName, visitDate = null } = request.body ?? {}
  if (
    typeof nurseName !== 'string' ||
    nurseName.trim().length < 2 ||
    nurseName.trim().length > 120
  ) {
    throw new HttpError(400, 'Enter a nurse name between 2 and 120 characters.')
  }
  const parsedVisitDate =
    typeof visitDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(visitDate)
      ? new Date(`${visitDate}T00:00:00.000Z`)
      : null
  if (
    visitDate !== null &&
    (typeof visitDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(visitDate) ||
      Number.isNaN(parsedVisitDate?.getTime()) ||
      parsedVisitDate?.toISOString().slice(0, 10) !== visitDate)
  ) {
    throw new HttpError(400, 'Visit date must use YYYY-MM-DD format.')
  }

  const link = await createFeedbackLink({
    nurseName: nurseName.trim(),
    visitDate,
  })
  response.status(201).json(link)
}

export async function exportFeedbackCsv(_request, response) {
  const feedback = await getAllFeedback()
  const csv = toCsv(
    feedback.map((entry) => ({
      id: entry.id,
      nurseName: entry.nurseName,
      visitDate: entry.visitDate,
      punctuality: entry.ratings.punctuality,
      qualityOfCare: entry.ratings.qualityOfCare,
      hygiene: entry.ratings.hygiene,
      behaviour: entry.ratings.behaviour,
      npsScore: entry.npsScore,
      comment: entry.comment,
      abusive: entry.abusive,
      synthetic: entry.synthetic,
      submittedAt: entry.submittedAt,
    })),
    [
      { key: 'id', label: 'Feedback ID' },
      { key: 'nurseName', label: 'Nurse' },
      { key: 'visitDate', label: 'Visit date' },
      { key: 'punctuality', label: 'Punctuality' },
      { key: 'qualityOfCare', label: 'Quality of care' },
      { key: 'hygiene', label: 'Hygiene' },
      { key: 'behaviour', label: 'Behaviour' },
      { key: 'npsScore', label: 'Recommendation score' },
      { key: 'comment', label: 'Comment' },
      { key: 'abusive', label: 'Abuse-flagged' },
      { key: 'synthetic', label: 'Synthetic demo data' },
      { key: 'submittedAt', label: 'Submitted at' },
    ],
  )

  response
    .status(200)
    .set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="carepulse-feedback.csv"',
      'Cache-Control': 'no-store',
    })
    .send(csv)
}
