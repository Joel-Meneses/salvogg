/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RefreshCw, Home, Flag, Award, Code } from 'lucide-react';
import { MatchStats, Team } from '../types/game';
import { CHARACTERS } from '../game/constants';
import { sounds } from '../audio/soundSystem';

interface GameOverModalProps {
  stats: MatchStats;
  userTeam: Team;
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  onOpenUnityModal: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  stats,
  userTeam,
  onPlayAgain,
  onBackToMenu,
  onOpenUnityModal,
}) => {
  const isVictory = stats.winner === userTeam;
  const isDraw = stats.winner === 'draw';

  useEffect(() => {
    if (isVictory) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isVictory]);

  const mvpPlayer = stats.players.find((p) => p.id === stats.mvpPlayerId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-950/90 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl">
        {/* Victory/Defeat Banner */}
        <div className="text-center mb-6">
          <div
            className={`w-16 h-16 mx-auto rounded-3xl flex items-center justify-center shadow-lg mb-3 ${
              isVictory
                ? 'bg-amber-500 text-slate-950 shadow-amber-500/30'
                : isDraw
                ? 'bg-slate-700 text-slate-200 shadow-slate-700/30'
                : 'bg-red-500 text-white shadow-red-500/30'
            }`}
          >
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-4xl md:text-5xl font-black font-display tracking-tight text-white">
            {isVictory ? 'VITÓRIA ÉPICA!' : isDraw ? 'EMPATE!' : 'DERROTA!'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {stats.winner === 'blue'
              ? 'O Time Azul dominou a arena e capturou as bandeiras!'
              : stats.winner === 'red'
              ? 'O Time Vermelho dominou a arena e capturou as bandeiras!'
              : 'O tempo se esgotou em uma disputa acirrada!'}
          </p>
        </div>

        {/* Scoreboard Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-500/30 flex flex-col items-center">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Time Azul</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-4xl font-black font-mono-nums text-white">{stats.blueFlagsCaptured}</span>
              <Flag className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">Bandeiras Capturadas</span>
          </div>

          <div className="p-4 bg-red-950/40 rounded-2xl border border-red-500/30 flex flex-col items-center">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Time Vermelho</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-4xl font-black font-mono-nums text-white">{stats.redFlagsCaptured}</span>
              <Flag className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5">Bandeiras Capturadas</span>
          </div>
        </div>

        {/* MVP Showcase */}
        {mvpPlayer && (
          <div className="p-3.5 bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 rounded-2xl border border-amber-500/40 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider block">Craque da Partida (MVP)</span>
                <span className="text-sm font-extrabold text-white">{mvpPlayer.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono-nums text-amber-300 font-bold">
              <span>{mvpPlayer.flagsCaptured} Bandeiras</span>
              <span>{mvpPlayer.alliesRescued} Salvos</span>
            </div>
          </div>
        )}

        {/* Player Stats Table */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/60">
          <div className="px-4 py-2.5 bg-slate-800/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
            <span>Jogador & Equipe</span>
            <div className="flex gap-6">
              <span title="Bandeiras Capturadas">Bandeiras</span>
              <span title="Inimigos Congelados">Congelados</span>
              <span title="Aliados Salvos">Salvos</span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-48 overflow-y-auto">
            {stats.players.map((p) => {
              const char = CHARACTERS[p.character];
              return (
                <div key={p.id} className="px-4 py-2 flex items-center justify-between text-xs hover:bg-slate-800/30">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{char.avatarIcon}</span>
                    <span className="font-bold text-slate-200">{p.name}</span>
                    <span className={`text-[10px] font-bold ${p.team === 'blue' ? 'text-blue-400' : 'text-red-400'}`}>
                      · {p.team === 'blue' ? 'Azul' : 'Vermelho'}
                    </span>
                  </div>
                  <div className="flex gap-8 font-mono-nums text-slate-300 font-semibold pr-2">
                    <span className="w-4 text-center text-amber-400 font-bold">{p.flagsCaptured}</span>
                    <span className="w-4 text-center text-cyan-400">{p.playersFrozen}</span>
                    <span className="w-4 text-center text-emerald-400 font-bold">{p.alliesRescued}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            <span>JOGAR NOVAMENTE</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onBackToMenu();
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>Menu</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onOpenUnityModal();
            }}
            className="w-full sm:w-auto px-5 py-3.5 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 font-bold rounded-xl border border-cyan-800 transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <Code className="w-4 h-4" />
            <span>Unity 6.3</span>
          </button>
        </div>
      </div>
    </div>
  );
};
