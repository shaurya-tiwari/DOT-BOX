import { useState } from 'react'
import SplashScreen from './components/SplashScreen'

function App() {
  const [showSplash, setShowSplash] = useState(true)

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}

      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight">Dots & Boxes ✦</h1>
      </div>
    </>
  )
}

export default App
