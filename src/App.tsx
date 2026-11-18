/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { GameOverModal } from './components/GameOverModal';
import { UnityExportModal } from './components/UnityExportModal';
import { GameEngine } from './game/gameEngine';
import { CharacterType, GameState, MatchStats, Team } from './types/game';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('menu');
  const [userTeam, setUserTeam] = useState<Team>('blue');
  const [userCharacter, setUserCharacter] = useState<CharacterType>('silver');
  const [cameraMode, setCameraMode] = useState<'follow' | 'tactical'>('follow');
  const [showUnityModal, setShowUnityModal] = useState<boolean>(false);
  const [matchStats, setMatchStats] = useState<MatchStats | null>(null);

  const [touchInput, setTouchInput] = useState<{ moveX: number; moveZ: number }>({ moveX: 0, moveZ: 0 });
  const [touchAbilityTriggered, setTouchAbilityTriggered] = useState<boolean>(false);

  const engineRef = useRef<GameEngine>(new GameEngine(userTeam, userCharacter));

  const handleStartGame = useCallback((team: Team, character: CharacterType) => {
    setUserTeam(team);
    setUserCharacter(character);
    const newEngine = new GameEngine(team, character);
    engineRef.current = newEngine;
    setGameState('playing');
    setMatchStats(null);
  }, []);

  const handleRestartMatch = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.initMatch();
      setGameState('playing');
      setMatchStats(null);
    }
  }, []);

  const handleBackToMenu = useCallback(() => {
    setGameState('menu');
    setMatchStats(null);
  }, []);

  const handleToggleCamera = useCallback(() => {
    setCameraMode((prev) => (prev === 'follow' ? 'tactical' : 'follow'));
  }, []);

  const handleAbilityTriggerHandled = useCallback(() => {
    setTouchAbilityTriggered(false);
  }, []);

  const checkGameOver = useCallback(() => {
    if (gameState === 'playing' && engineRef.current && !engineRef.current.isMatchActive) {
      const stats = engineRef.current.getMatchStats();
      setMatchStats(stats);
      setGameState('game_over');
    }
  }, [gameState]);

  React.useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(checkGameOver, 300);
    return () => clearInterval(interval);
  }, [gameState, checkGameOver]);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden select-none font-sans">
      <GameCanvas
        engine={engineRef.current}
        cameraMode={cameraMode}
        touchInput={touchInput}
        touchAbilityTriggered={touchAbilityTriggered}
        onAbilityTriggerHandled={handleAbilityTriggerHandled}
      />

      {gameState === 'playing' && (
        <HUD
          engine={engineRef.current}
          cameraMode={cameraMode}
          onToggleCamera={handleToggleCamera}
          onOpenMenu={handleBackToMenu}
          onRestartMatch={handleRestartMatch}
          onTouchMove={setTouchInput}
          onTouchAbility={() => setTouchAbilityTriggered(true)}
        />
      )}

      {gameState === 'menu' && (
        <MainMenu
          onStartGame={handleStartGame}
          onOpenUnityModal={() => setShowUnityModal(true)}
        />
      )}

      {gameState === 'game_over' && matchStats && (
        <GameOverModal
          stats={matchStats}
          userTeam={userTeam}
          onPlayAgain={handleRestartMatch}
          onBackToMenu={handleBackToMenu}
          onOpenUnityModal={() => setShowUnityModal(true)}
        />
      )}

      {showUnityModal && (
        <UnityExportModal onClose={() => setShowUnityModal(false)} />
      )}
    </div>
  );
}
