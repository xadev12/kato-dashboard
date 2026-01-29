interface Props {
  value: number
}

export function ProgressBar({ value }: Props) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const color =
    clampedValue >= 100
      ? 'bg-emerald-500'
      : clampedValue >= 50
        ? 'bg-blue-500'
        : 'bg-amber-500'

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 tabular-nums w-8 text-right">{clampedValue}%</span>
    </div>
  )
}
