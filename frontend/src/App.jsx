import { useState, useCallback } from 'react'
import SplashScreen from './components/SplashScreen'
import Home from './pages/Home'
import CreateGame from './pages/CreateGame'
import JoinGame from './pages/JoinGame'
import WaitingRoom from './pages/WaitingRoom'
import Game from './pages/Game'
import GameResult from './pages/GameResult'

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [view, setView] = useState('home')
  const [gameData, setGameData] = useState(null)
  // gameData shape: { roomId, playerId, playerName, gameState }

  const handleSplashComplete = useCallback(() => setSplashDone(true), [])

  function navigate(page, extra = {}) {
    setGameData(prev => prev ? { ...prev, ...extra } : extra)
    setView(page)
  }

  return (
    <div className="app">
      {!splashDone && <SplashScreen onComplete={handleSplashComplete} />}
      {splashDone && view === 'home' && <Home navigate={navigate} />}
      {splashDone && view === 'create' && <CreateGame navigate={navigate} />}
      {splashDone && view === 'join' && <JoinGame navigate={navigate} />}
      {splashDone && view === 'waiting' && <WaitingRoom navigate={navigate} gameData={gameData} />}
      {splashDone && view === 'game' && (
        <Game navigate={navigate} gameData={gameData} setGameData={setGameData} />
      )}
      {splashDone && view === 'result' && (
        <GameResult navigate={navigate} gameData={gameData} />
      )}
    </div>
  )
}
