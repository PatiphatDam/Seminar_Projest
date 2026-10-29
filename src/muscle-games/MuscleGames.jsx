import { Component, useMemo } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ScoresProvider } from './scores.jsx';
import { FxProvider } from './fx/Fx.jsx';
import { GamesConfigContext } from './config.js';
import GamesHub from './GamesHub.jsx';
import GamePage from './components/GamePage.jsx';
import BalloonPop from './games/BalloonPop.jsx';
import GroupSort from './games/GroupSort.jsx';
import Diameter from './games/diameter/Diameter.jsx';
import { gameById } from './games/meta.js';
import './styles.css';

class GameErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[MuscleGames] crashed', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mg-page mg-crash" role="alert">
        <h1>Something went wrong</h1>
        <p className="mg-muted">The game couldn’t load. Try reloading the page.</p>
        <button type="button" className="mg-btn mg-btn--primary" onClick={() => window.location.reload()}>
          ↻ Reload
        </button>
      </div>
    );
  }
}

/**
 * Drop-in games module for a React Router v6 site. Mount it on a splat route:
 *   <Route path="/games/*" element={<MuscleGames onGameFinish={saveRun} />} />
 * Every link inside is relative, so any base path works.
 */
export default function MuscleGames({ onGameFinish, className = '' }) {
  const config = useMemo(() => ({ onGameFinish }), [onGameFinish]);
  return (
    <div className={`mg-root ${className}`.trim()}>
      <GamesConfigContext.Provider value={config}>
        <ScoresProvider>
          <FxProvider>
            <GameErrorBoundary>
              <Routes>
                <Route index element={<GamesHub />} />
                <Route path="balloon-pop" element={<GamePage key="balloon-pop" game={gameById('balloon-pop')} Game={BalloonPop} />} />
                <Route path="group-sort" element={<GamePage key="group-sort" game={gameById('group-sort')} Game={GroupSort} />} />
                <Route path="diameter" element={<GamePage key="diameter" game={gameById('diameter')} Game={Diameter} />} />
                <Route path="*" element={<Navigate to=".." replace />} />
              </Routes>
            </GameErrorBoundary>
          </FxProvider>
        </ScoresProvider>
      </GamesConfigContext.Provider>
    </div>
  );
}
