import { Copy, Link2 } from 'lucide-react'
import { useState } from 'react'
import apiClient from '../services/apiClient'

export function CreateFeedbackLink() {
  const [nurseName, setNurseName] = useState('')
  const [visitDate, setVisitDate] = useState('')
  const [feedbackUrl, setFeedbackUrl] = useState('')
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setFeedbackUrl('')
    setCopied(false)
    setSubmitting(true)

    try {
      const { data } = await apiClient.post('/admin/feedback-links', {
        nurseName,
        visitDate: visitDate || null,
      })
      setFeedbackUrl(data.url)
    } catch (requestError) {
      setError(
        requestError.response?.data?.error ||
          'Unable to create a feedback link. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(feedbackUrl)
      setCopied(true)
      setError('')
    } catch {
      setError('Could not access the clipboard. Copy the link from the field.')
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-800">
          <Link2 aria-hidden="true" size={20} />
        </span>
        <div>
          <h2 className="font-semibold text-slate-900">Create a feedback link</h2>
          <p className="mt-1 text-sm text-slate-500">
            Share a one-time link with a family. Links expire after 7 days.
          </p>
        </div>
      </div>
      <form className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]" onSubmit={handleSubmit}>
        <label className="text-sm font-medium text-slate-700">
          Nurse name
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            maxLength={120}
            minLength={2}
            onChange={(event) => setNurseName(event.target.value)}
            required
            value={nurseName}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Visit date <span className="font-normal text-slate-400">(optional)</span>
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            onChange={(event) => setVisitDate(event.target.value)}
            type="date"
            value={visitDate}
          />
        </label>
        <button
          className="self-end rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Creating…' : 'Create link'}
        </button>
      </form>
      {feedbackUrl && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            aria-label="Generated feedback link"
            className="min-w-0 flex-1 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-950"
            readOnly
            value={feedbackUrl}
          />
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            onClick={copyLink}
            type="button"
          >
            <Copy aria-hidden="true" size={16} />
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      )}
      {error && (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {error}
        </p>
      )}
    </section>
  )
}
