import { HeartPulse, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import apiClient from '../services/apiClient'

const ratingQuestions = [
  { field: 'punctuality', label: 'Punctuality' },
  { field: 'qualityOfCare', label: 'Quality of care' },
  { field: 'hygiene', label: 'Hygiene' },
  { field: 'behaviour', label: 'Behaviour' },
]

const emptyRatings = {
  punctuality: '',
  qualityOfCare: '',
  hygiene: '',
  behaviour: '',
}

export function FeedbackPage() {
  const { visitId: token } = useParams()
  const [link, setLink] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [ratings, setRatings] = useState(emptyRatings)
  const [npsScore, setNpsScore] = useState('')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!token) {
      return undefined
    }

    apiClient
      .get(`/public/feedback/${encodeURIComponent(token)}`)
      .then(({ data }) => {
        setLink(data)
        setStatus('ready')
      })
      .catch((requestError) => {
        setError(
          requestError.response?.data?.error ||
            'This feedback link could not be verified. Please contact your care team.',
        )
        setStatus('unavailable')
      })
  }, [token])

  const currentStatus = token ? status : 'unavailable'
  const linkError = token
    ? error
    : 'Open the unique feedback link shared with you to continue.'

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      await apiClient.post(`/public/feedback/${encodeURIComponent(token)}`, {
        ratings: Object.fromEntries(
          Object.entries(ratings).map(([field, value]) => [field, Number(value)]),
        ),
        npsScore: Number(npsScore),
        comment,
      })
      setStatus('submitted')
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Your feedback could not be submitted. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <BrandMark />
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
            <ShieldCheck aria-hidden="true" size={15} />
            Private feedback
          </span>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <span className="flex size-11 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <HeartPulse aria-hidden="true" size={22} />
          </span>
          <p className="mt-6 text-sm font-medium text-teal-800">
            Your experience matters
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Share feedback about a care visit
          </h1>
          {currentStatus === 'loading' && (
            <p className="mt-4 text-sm text-slate-500" role="status">
              Verifying your private feedback link…
            </p>
          )}
          {currentStatus === 'unavailable' && (
            <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="alert">
              {linkError}
            </div>
          )}
          {currentStatus === 'submitted' && (
            <div className="mt-6 rounded-lg border border-teal-200 bg-teal-50 px-4 py-4 text-sm text-teal-900" role="status">
              Thank you. Your feedback has been submitted securely.
            </div>
          )}
          {currentStatus === 'ready' && link && (
            <>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Your feedback is about a visit with{' '}
                <span className="font-medium text-slate-700">{link.nurseName}</span>
                {link.visitDate ? ` on ${link.visitDate}` : ''}. This private link
                can be used once and expires {new Date(link.expiresAt).toLocaleString()}.
              </p>
              <form className="mt-7 space-y-6" onSubmit={handleSubmit}>
                <fieldset className="space-y-4">
                  <legend className="text-sm font-semibold text-slate-800">
                    How would you rate this visit?
                  </legend>
                  {ratingQuestions.map(({ field, label }) => (
                    <label
                      key={field}
                      className="grid gap-2 text-sm font-medium text-slate-700 sm:grid-cols-[1fr_220px] sm:items-center"
                    >
                      {label}
                      <select
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                        onChange={(event) =>
                          setRatings((current) => ({
                            ...current,
                            [field]: event.target.value,
                          }))
                        }
                        required
                        value={ratings[field]}
                      >
                        <option value="">Choose a rating</option>
                        <option value="1">1 - Needs improvement</option>
                        <option value="2">2 - Fair</option>
                        <option value="3">3 - Good</option>
                        <option value="4">4 - Very good</option>
                        <option value="5">5 - Excellent</option>
                      </select>
                    </label>
                  ))}
                </fieldset>

                <label className="block text-sm font-medium text-slate-700">
                  How likely are you to recommend this care service?
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    0 means not at all likely; 10 means extremely likely.
                  </span>
                  <select
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100 sm:max-w-xs"
                    onChange={(event) => setNpsScore(event.target.value)}
                    required
                    value={npsScore}
                  >
                    <option value="">Choose a score</option>
                    {Array.from({ length: 11 }, (_, score) => (
                      <option key={score} value={score}>{score}</option>
                    ))}
                  </select>
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Comments <span className="font-normal text-slate-400">(optional)</span>
                  <textarea
                    className="mt-2 min-h-32 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    maxLength={2000}
                    onChange={(event) => setComment(event.target.value)}
                    placeholder="Tell us what went well or what could be improved."
                    value={comment}
                  />
                  <span className="mt-1 block text-right text-xs text-slate-400">
                    {comment.length}/2000
                  </span>
                </label>

                {error && (
                  <p className="text-sm text-rose-700" role="alert">{error}</p>
                )}
                <button
                  className="w-full rounded-lg bg-teal-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
                  disabled={submitting}
                  type="submit"
                >
                  {submitting ? 'Submitting…' : 'Submit feedback'}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-slate-400">
          CarePulse · Feedback is shared securely with your care team
        </p>
      </section>
    </main>
  )
}
