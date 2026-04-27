import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2">SportBets</h1>
          <p className="text-center text-gray-400">Your Sports Betting Platform</p>
        </header>

        <main className="max-w-4xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Welcome to SportBets</h2>
            <p className="text-gray-300 mb-4">
              Get started with your sports betting experience. Place bets on your favorite teams and track your winnings.
            </p>
            <button
              onClick={() => setCount((count) => count + 1)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              Count is {count}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Live Odds</h3>
              <p className="text-gray-400">Real-time odds updates</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-2">Your Bets</h3>
              <p className="text-gray-400">Track your betting history</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
