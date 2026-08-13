import React from 'react'

const STEPS = ['PLACED', 'ACCEPTED', 'PREPARING', 'READY', 'COLLECTED']
const LABELS = {
  PLACED: 'Placed',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  COLLECTED: 'Collected',
}

export default function StatusPipeline({ status }) {
  const currentIndex = STEPS.indexOf(status)

  return (
    <div className="flex items-center justify-between w-full">
      {STEPS.map((step, idx) => {
        const done = idx <= currentIndex
        const isLast = idx === STEPS.length - 1
        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center flex-shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors ${
                  done ? 'bg-leaf border-leaf text-cream' : 'bg-cream border-mist text-ink/40'
                }`}
              >
                {done ? '✓' : idx + 1}
              </div>
              <span className={`mt-2 text-xs ${done ? 'text-ink font-medium' : 'text-ink/40'}`}>
                {LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div className={`flex-1 h-0.5 mx-1 ${idx < currentIndex ? 'bg-leaf' : 'bg-mist'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
