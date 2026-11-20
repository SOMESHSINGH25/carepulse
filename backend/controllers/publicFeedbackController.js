import { getFeedbackLink, submitFeedback } from '../services/feedbackService.js'
import { HttpError } from '../utils/httpError.js'

const ratingFields = [
  'punctuality',
  'qualityOfCare',
  'hygiene',
  'behaviour',
]

function validateSubmission(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'A feedback response is required.')
  }

  const ratings = body.ratings
  if (
    !ratings ||
    typeof ratings !== 'object' ||
    !ratingFields.every(
      (field) =>
        Number.isInteger(ratings[field]) &&
        ratings[field] >= 1 &&
        ratings[field] <= 5,
    )
  ) {
    throw new HttpError(400, 'Please provide all four ratings from 1 to 5.')
  }

  if (
    !Number.isInteger(body.npsScore) ||
    body.npsScore < 0 ||
    body.npsScore > 10
  ) {
    throw new HttpError(400, 'Please provide a recommendation score from 0 to 10.')
  }

  if (
    typeof body.comment !== 'string' ||
    body.comment.trim().length > 2000
  ) {
    throw new HttpError(400, 'Comments must be 2,000 characters or fewer.')
  }

  return {
    ratings,
    npsScore: body.npsScore,
    comment: body.comment,
  }
}

export async function readPublicFeedbackLink(request, response) {
  const link = await getFeedbackLink(request.params.token)
  response.json(link)
}

export async function createPublicFeedback(request, response) {
  const submission = validateSubmission(request.body)
  const result = await submitFeedback(request.params.token, submission)
  response.status(201).json(result)
}
