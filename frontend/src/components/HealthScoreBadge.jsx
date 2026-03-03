import { healthColor, healthLabel } from '../utils/formatters'

export default function HealthScoreBadge({ score, size = 'md' }) {
  const color = healthColor(score)
  const label = healthLabel(score)
  const rounded = Math.round(score)

  if (size === 'lg') {
    const radius = 28
    const circumference = 2 * Math.PI * radius
    const progress = (rounded / 100) * circumference
    const offset = circumference - progress

    return (
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16">
          <svg width="64" height="64" className="-rotate-90">
            {/* Background ring */}
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke="#1c2333"
              strokeWidth="3"
            />
            {/* Progress ring */}
            <circle
              cx="32" cy="32" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                filter: `drop-shadow(0 0 4px ${color}60)`,
                animation: 'health-fill 1s ease-out',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-bold" style={{ color }}>
              {rounded}
            </span>
          </div>
        </div>
        <div className="text-xs mt-1 font-medium" style={{ color }}>
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
      <span className="text-sm font-bold tabular-nums" style={{ color }}>
        {rounded}
      </span>
      <span className="text-[10px] text-terminal-dim">/100</span>
    </div>
  )
}
