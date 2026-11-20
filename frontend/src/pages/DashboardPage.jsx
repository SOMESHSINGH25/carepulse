import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEffect, useState } from 'react'
import { CreateFeedbackLink } from '../components/CreateFeedbackLink'
import apiClient from '../services/apiClient'

const ratingLabels = {
  punctuality: 'Punctuality',
  qualityOfCare: 'Quality of care',
  hygiene: 'Hygiene',
  behaviour: 'Behaviour',
}

function MetricCard({ label, value, detail }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs text-slate-400">{detail}</p>
    </article>
  )
}

function displayDate(value) {
  if (!value) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(value))
}

export function DashboardPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [includeFlagged, setIncludeFlagged] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    let active = true
    apiClient
      .get('/admin/dashboard', { params: { includeFlagged } })
      .then(({ data: dashboardData }) => {
        if (active) setData(dashboardData)
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.error ||
              'Unable to load dashboard data. Check the API connection.',
          )
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [includeFlagged, refreshKey])

  function reloadDashboard() {
    setLoading(true)
    setError('')
    setRefreshKey((current) => current + 1)
  }

  async function exportCsv() {
    setExportError('')
    setExporting(true)
    try {
      const response = await apiClient.get('/admin/feedback/export.csv', {
        responseType: 'blob',
      })
      const url = URL.createObjectURL(response.data)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = 'carepulse-feedback.csv'
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setExportError(
        requestError.response?.data?.error ||
          'Unable to export feedback. Please try again.',
      )
    } finally {
      setExporting(false)
    }
  }

  const summary = data?.summary
  const averageRating =
    summary?.averageRating === null || summary?.averageRating === undefined
      ? '—'
      : `${summary.averageRating.toFixed(2)} / 5`
  const nps = summary?.nps === null || summary?.nps === undefined
    ? '—'
    : String(summary.nps)

  return (
    <div>
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-teal-800">Care quality</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
            Feedback dashboard
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Ratings, trends, and follow-up from family visit feedback.
          </p>
        </div>
        <button
          className="w-fit rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          disabled={exporting}
          onClick={exportCsv}
          type="button"
        >
          {exporting ? 'Preparing CSV…' : 'Export feedback CSV'}
        </button>
      </div>

      {exportError && (
        <p className="mt-3 text-sm text-rose-700" role="alert">
          {exportError}
        </p>
      )}

      {summary?.syntheticCount > 0 && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Demo data: {summary.syntheticCount} synthetic record
          {summary.syntheticCount === 1 ? '' : 's'} are included. They are
          labelled in exports and are not family submissions.
        </div>
      )}

      <div className="mt-6">
        <CreateFeedbackLink />
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800" role="alert">
          <p className="font-semibold">Dashboard data could not be loaded</p>
          <p className="mt-1">{error}</p>
          <button
            className="mt-3 font-semibold underline underline-offset-2"
            onClick={reloadDashboard}
            type="button"
          >
            Try again
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
          Loading feedback data…
        </div>
      ) : (
        data && (
          <>
            <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Feedback summary">
              <MetricCard
                label="Average nurse rating"
                value={averageRating}
                detail="Across the four visit ratings"
              />
              <MetricCard
                label="Net Promoter Score"
                value={nps}
                detail="Promoters minus detractors"
              />
              <MetricCard
                label="Family responses"
                value={summary.feedbackCount}
                detail="Submitted feedback forms"
              />
              <MetricCard
                label="Comments flagged"
                value={summary.flaggedCount}
                detail="Abusive language filtered from display"
              />
            </section>

            {summary.feedbackCount === 0 ? (
              <section className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
                <h2 className="font-semibold text-slate-900">No feedback yet</h2>
                <p className="mt-2 text-sm text-slate-500">
                  Create a one-time feedback link above, or seed clearly labelled
                  synthetic demo responses from the backend.
                </p>
              </section>
            ) : (
              <>
                <section className="mt-6 grid gap-5 xl:grid-cols-2">
                  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                    <h2 className="font-semibold text-slate-900">Rating trends</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Daily average across all four rating questions
                    </p>
                    <div className="mt-5 h-64 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data.ratingTrends}>
                          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Line
                            dataKey="averageRating"
                            name="Average rating"
                            stroke="#0f766e"
                            strokeWidth={2.5}
                            dot={{ r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </article>
                  <article className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                    <h2 className="font-semibold text-slate-900">Average by nurse</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Mean of received ratings, not a ranking target
                    </p>
                    <div className="mt-5 h-64 min-w-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.nurseRatings} layout="vertical" margin={{ left: 12, right: 12 }}>
                          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                          <YAxis
                            dataKey="nurseName"
                            type="category"
                            width={100}
                            tick={{ fontSize: 11 }}
                          />
                          <Tooltip />
                          <Bar dataKey="averageRating" name="Average rating" fill="#0f766e" radius={[0, 5, 5, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </article>
                </section>

                <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
                  <h2 className="font-semibold text-slate-900">Rating breakdown</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {Object.entries(ratingLabels).map(([field, label]) => (
                      <div key={field} className="rounded-lg bg-slate-50 p-4">
                        <p className="text-sm text-slate-500">{label}</p>
                        <p className="mt-1 text-xl font-semibold text-slate-900">
                          {summary.ratingAverages[field] ?? '—'}
                          <span className="ml-1 text-sm font-normal text-slate-400">/ 5</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  <div className="flex flex-col justify-between gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:px-6">
                    <div>
                      <h2 className="font-semibold text-slate-900">Low-score follow-up</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Responses averaging 3 or below, or with any rating of 2 or below
                      </p>
                    </div>
                    <label className="flex items-center gap-2 text-sm text-slate-600">
                      <input
                        checked={includeFlagged}
                        onChange={(event) => {
                          setLoading(true)
                          setError('')
                          setIncludeFlagged(event.target.checked)
                        }}
                        type="checkbox"
                      />
                      Include abuse-flagged responses
                    </label>
                  </div>
                  {data.lowScoreFollowUp.length === 0 ? (
                    <p className="px-6 py-8 text-sm text-slate-500">
                      No low-score responses match this filter.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-6 py-3 font-medium">Nurse</th>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Average</th>
                            <th className="px-6 py-3 font-medium">Comment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.lowScoreFollowUp.map((entry) => {
                            const ratings = Object.values(entry.ratings)
                            const average = ratings.reduce((sum, score) => sum + score, 0) / ratings.length
                            return (
                              <tr key={entry.id}>
                                <td className="px-6 py-4 font-medium text-slate-800">{entry.nurseName}</td>
                                <td className="px-6 py-4 text-slate-600">{displayDate(entry.submittedAt)}</td>
                                <td className="px-6 py-4 font-semibold text-amber-700">{average.toFixed(1)} / 5</td>
                                <td className="max-w-md px-6 py-4 text-slate-600">
                                  {entry.comment || 'No comment provided'}
                                  {entry.abusive && (
                                    <span className="ml-2 text-xs font-medium text-rose-700">
                                      Filtered
                                    </span>
                                  )}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </section>
              </>
            )}

            <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="font-semibold text-slate-900">Recent feedback</h2>
              {data.recentFeedback.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No responses match this filter.</p>
              ) : (
                <ul className="mt-4 divide-y divide-slate-100">
                  {data.recentFeedback.slice(0, 8).map((entry) => (
                    <li key={entry.id} className="flex flex-col gap-1 py-3 first:pt-0 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {entry.nurseName}
                          {entry.abusive && (
                            <span className="ml-2 text-xs font-medium text-rose-700">Flagged comment hidden</span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {entry.comment || 'No comment provided'}
                        </p>
                      </div>
                      <span className="shrink-0 text-xs text-slate-400">
                        {displayDate(entry.submittedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )
      )}
    </div>
  )
}
