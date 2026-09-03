import { useState } from 'react'
import Home from './pages/Home'
import CreateGame from './pages/CreateGame'
import JoinGame from './pages/JoinGame'
import WaitingRoom from './pages/WaitingRoom'
import Game from './pages/Game'
import GameResult from './pages/GameResult'

export default function App() {
  const [view, setView] = useState('home')
  const [gameData, setGameData] = useState(null)
  // gameData shape: { roomId, playerId, playerName, gameState }

  function navigate(page, extra = {}) {
    // Reset all game state when returning to top-level pages
    // This prevents stale isJoiner / roomId from a previous session bleeding in
    if (['home', 'create', 'join'].includes(page)) {
      setGameData(Object.keys(extra).length ? extra : null)
    } else {
      setGameData(prev => prev ? { ...prev, ...extra } : extra)
    }
    setView(page)
  }

  return (
    <div className="app">
      {view === 'home'    && <Home navigate={navigate} />}
      {view === 'create'  && <CreateGame navigate={navigate} />}
      {view === 'join'    && <JoinGame navigate={navigate} />}
      {view === 'waiting' && (gameData?.roomId ? <WaitingRoom navigate={navigate} gameData={gameData} /> : <Home navigate={navigate} />)}
      {view === 'game'    && (gameData?.roomId ? <Game navigate={navigate} gameData={gameData} setGameData={setGameData} /> : <Home navigate={navigate} />)}
      {view === 'result'  && (gameData?.roomId ? <GameResult navigate={navigate} gameData={gameData} /> : <Home navigate={navigate} />)}
    </div>
  )
}
