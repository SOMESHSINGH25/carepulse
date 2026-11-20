import { HeartPulse } from 'lucide-react'

export function BrandMark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 items-center justify-center rounded-xl bg-teal-700 text-white shadow-sm">
        <HeartPulse aria-hidden="true" size={22} strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="text-xl font-semibold tracking-tight text-slate-900">
          Care<span className="text-teal-700">Pulse</span>
        </span>
      )}
    </div>
  )
}
