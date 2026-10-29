import { createContext, useContext } from 'react';

// Options passed to <MuscleGames /> by the host site.
export const GamesConfigContext = createContext({ onGameFinish: undefined, hubTitle: true, playerId: null });
export const useGamesConfig = () => useContext(GamesConfigContext);
