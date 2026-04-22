import React from 'react'

type StreakProps = {
  /** Number of consecutive days with a push/commit */
  count?: number
}

export default function Streak({ count = 0 }: StreakProps) {
  return (
    <div className="streak" style={{display: 'inline-flex', alignItems: 'center', gap: 8}}>
      <div style={{fontWeight: 700, fontSize: 18}}>{count}</div>
      <div style={{fontSize: 13, color: '#666'}}>{count === 1 ? 'day streak' : 'days streak'}</div>
    </div>
  )
}
