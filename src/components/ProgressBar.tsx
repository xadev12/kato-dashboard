import { memo } from 'react'

interface Props {
  value: number
}

// Memo for performance (rerender-memo)
export const ProgressBar = memo(function ProgressBar({ value }: Props) {
  const clampedValue = Math.min(100, Math.max(0, value))
  
  return (
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  )
})
