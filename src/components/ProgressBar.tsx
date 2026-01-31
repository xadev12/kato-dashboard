import { memo } from 'react'

interface Props {
  value: number
  variant?: 'high' | 'medium' | 'low'
}

const variantStyles = {
  high: 'from-rose-500 to-rose-400',
  medium: 'from-amber-500 to-amber-400', 
  low: 'from-emerald-500 to-emerald-400'
}

// Memo for performance (rerender-memo)
export const ProgressBar = memo(function ProgressBar({ value, variant = 'low' }: Props) {
  const clampedValue = Math.min(100, Math.max(0, value))
  const gradient = variantStyles[variant]
  
  return (
    <div className="relative h-1.5 bg-white/[0.03] rounded-full overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${gradient} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
})
