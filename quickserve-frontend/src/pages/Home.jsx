import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="max-w-5xl mx-auto px-5 py-16">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-block text-xs uppercase tracking-widest text-clay font-semibold mb-4">
            No more standing in line
          </span>
          <h1 className="font-display text-5xl leading-tight text-ink mb-6">
            Order ahead.<br />Grab a token.<br />Skip the queue.
          </h1>
          <p className="text-ink/70 text-lg mb-8 max-w-md">
            QuickServe predicts your wait time, hands you a digital token the moment you pay,
            and tells you exactly when your food will be ready &mdash; no more guessing at the counter.
          </p>
          <div className="flex gap-4">
            {isAuthenticated ? (
              <Link to="/menu" className="bg-ink text-cream px-6 py-3 rounded-full font-medium hover:bg-leaf transition-colors">
                Browse the menu
              </Link>
            ) : (
              <>
                <Link to="/register" className="bg-ink text-cream px-6 py-3 rounded-full font-medium hover:bg-leaf transition-colors">
                  Create an account
                </Link>
                <Link to="/login" className="border border-ink px-6 py-3 rounded-full font-medium hover:bg-mist transition-colors">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="token-stub shadow-lg p-8 rotate-2">
          <div className="text-xs uppercase tracking-widest text-ink/40 mb-1">QuickServe Token</div>
          <div className="font-display text-4xl text-clay mb-4">QS-1042</div>
          <div className="dashed-divider my-4" />
          <div className="flex justify-between text-sm mb-1">
            <span className="text-ink/60">Status</span>
            <span className="font-medium text-leaf">Preparing</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink/60">Est. wait</span>
            <span className="font-medium">7 min</span>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-6 mt-20">
        <Feature title="Pre-order" text="Pick your meal and pickup time before you even leave your desk." />
        <Feature title="Smart tokens" text="Tokens are sequenced by prep time and kitchen load, not just who paid first." />
        <Feature title="Live tracking" text="Watch your order move from placed to ready in real time." />
      </div>
    </div>
  )
}

function Feature({ title, text }) {
  return (
    <div className="bg-white/60 border border-mist rounded-2xl p-6">
      <h3 className="font-display text-xl text-ink mb-2">{title}</h3>
      <p className="text-sm text-ink/60">{text}</p>
    </div>
  )
}
