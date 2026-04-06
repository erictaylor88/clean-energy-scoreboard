import type { ProjectionResult } from '@/lib/projections'

export default function MilestoneCountdown({
  projections,
  currentYear,
}: {
  projections: ProjectionResult[]
  currentYear: number
}) {
  if (projections.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {projections.map((p) => {
        const reached = p.projectedYear !== null && p.projectedYear <= currentYear
        const yearsAway = p.projectedYear ? p.projectedYear - currentYear : null

        return (
          <div
            key={p.milestone}
            className="bg-bg-surface border border-border-default rounded-xl px-4 py-5 sm:px-5 text-center"
          >
            {/* Milestone label */}
            <p className="text-xs font-body font-medium text-text-secondary uppercase tracking-[0.04em] mb-2">
              {p.milestone}% Clean
            </p>

            {/* Main value */}
            {reached ? (
              <p className="text-2xl font-body font-bold tabular-nums text-accent-green">
                Reached ✓
              </p>
            ) : p.sufficient && p.projectedYear ? (
              <>
                <p className="text-3xl font-body font-bold tabular-nums text-text-primary">
                  {p.projectedYear}
                </p>
                <p className="text-sm font-body text-text-secondary mt-1">
                  ~{yearsAway} {yearsAway === 1 ? 'year' : 'years'} away
                </p>
              </>
            ) : (
              <p className="text-sm font-body text-text-muted mt-1">
                Insufficient trend data
              </p>
            )}

            {/* Growth rate */}
            {p.annualGrowth !== 0 && p.sufficient && (
              <p className="text-xs font-body text-text-muted mt-2 tabular-nums">
                {p.annualGrowth > 0 ? '+' : ''}{p.annualGrowth.toFixed(2)}pp/year
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
