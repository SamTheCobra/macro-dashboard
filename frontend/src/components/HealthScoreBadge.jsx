import { healthColor, healthLabel } from '../utils/formatters'

export default function HealthScoreBadge({ score, size = 'md' }) {
  const color = healthColor(score)
  const label = healthLabel(score)

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center">
        <div
          className="relative flex items-center justify-center rounded-full border-2 w-16 h-16"
          style={{ borderColor: color, boxShadow: `0 0 16px ${color}40` }}
        >
          <span className="text-xl font-bold" style={{ color }}>
            {Math.round(score)}
          </span>
        </div>
        <div className="text-xs mt-1" style={{ color }}>
          {label}
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
      />
      <span className="text-sm font-medium" style={{ color }}>
        {Math.round(score)}
      </span>
      <span className="text-xs text-terminal-dim">/100</span>
    </div>
  )
}
