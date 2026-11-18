/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Play, Shield, Zap, Snowflake, HelpCircle, Code, Volume2, VolumeX, Flag, Check, ChevronRight } from 'lucide-react';
import { CHARACTERS } from '../game/constants';
import { CharacterType, Team } from '../types/game';
import { sounds } from '../audio/soundSystem';

interface MainMenuProps {
  onStartGame: (team: Team, character: CharacterType) => void;
  onOpenUnityModal: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({ onStartGame, onOpenUnityModal }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team>('blue');
  const [selectedChar, setSelectedChar] = useState<CharacterType>('silver');
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  const charactersList: CharacterType[] = ['bobby', 'silver', 'luppy'];

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const handleStart = () => {
    sounds.playClick();
    onStartGame(selectedTeam, selectedChar);
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-between p-4 md:p-8 bg-gradient-to-b from-slate-950/95 via-slate-900/95 to-indigo-950/95 overflow-y-auto">
      {/* Top Navbar */}
      <header className="w-full max-w-5xl flex items-center justify-between gap-8 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-red-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Flag className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-wider text-white font-display whitespace-nowrap">
            Barra Bandeira
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHowToPlay(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700/60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span>Regras</span>
          </button>
          <button
            onClick={onOpenUnityModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:text-cyan-200 bg-cyan-950/60 hover:bg-cyan-900/60 rounded-xl border border-cyan-800/50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Code className="w-4 h-4 text-cyan-400" />
            <span>Unity 6.3 & Scripts C#</span>
          </button>
          <button
            onClick={toggleSound}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl border border-slate-700/60 transition-colors cursor-pointer"
            title="Alternar Áudio"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Main Hero & Setup Area */}
      <main className="w-full max-w-4xl flex flex-col items-center my-auto py-6">
        <div className="text-center mb-8">
          <p className="text-xs font-semibold text-amber-400 tracking-wide mb-2">
            SALVO! · Protótipo 3v3 · Unity 6.3 & Web 3D
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white font-display drop-shadow-md">
            Barra Bandeira <span className="text-amber-400">MVP</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto mt-2 leading-relaxed">
            Capture as 3 bandeiras do time adversário e traga-as para sua base enquanto defende seu território congelando os invasores com um toque.
          </p>
        </div>

        {/* Team Selection */}
        <div className="w-full max-w-lg mb-6">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 text-center">
            Escolha sua Equipe
          </label>
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              onClick={() => {
                setSelectedTeam('blue');
                sounds.playClick();
              }}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                selectedTeam === 'blue'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-blue-400 shadow-sm" />
              <span className="whitespace-nowrap">Time Azul (3)</span>
              {selectedTeam === 'blue' && <Check className="w-4 h-4 ml-auto" />}
            </button>

            <button
              onClick={() => {
                setSelectedTeam('red');
                sounds.playClick();
              }}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                selectedTeam === 'red'
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-red-400 shadow-sm" />
              <span className="whitespace-nowrap">Time Vermelho (3)</span>
              {selectedTeam === 'red' && <Check className="w-4 h-4 ml-auto" />}
            </button>
          </div>
        </div>

        {/* Character Selection (Bobby, Silver, Luppy) */}
        <div className="w-full mb-8">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3 text-center">
            Selecione seu Personagem
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {charactersList.map((charId) => {
              const char = CHARACTERS[charId];
              const isSelected = selectedChar === charId;

              return (
                <div
                  key={charId}
                  onClick={() => {
                    setSelectedChar(charId);
                    sounds.playClick();
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/95 border-amber-400 shadow-xl shadow-amber-500/10 scale-[1.02]'
                      : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{char.avatarIcon}</span>
                      <span className="text-xs font-semibold text-slate-400">{char.role}</span>
                    </div>

                    <h3 className="text-xl font-extrabold text-white font-display">{char.name}</h3>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">{char.roleDescription}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center justify-between text-xs font-bold mb-1">
                      <span className="text-amber-300 flex items-center gap-1">
                        {charId === 'bobby' && <Shield className="w-3.5 h-3.5" />}
                        {charId === 'silver' && <Zap className="w-3.5 h-3.5" />}
                        {charId === 'luppy' && <Snowflake className="w-3.5 h-3.5" />}
                        {char.abilityName}
                      </span>
                      <span className="text-slate-400 font-mono-nums">{char.cooldownSeconds}s recarga</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-tight">{char.abilityDescription}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game CTA */}
        <button
          onClick={handleStart}
          className="group px-10 py-4 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-400 hover:to-red-400 text-slate-950 font-black text-lg md:text-xl rounded-2xl shadow-2xl shadow-orange-500/40 hover:shadow-orange-500/60 transition-all transform active:scale-95 flex items-center gap-3 cursor-pointer"
        >
          <Play className="w-6 h-6 fill-slate-950" />
          <span className="whitespace-nowrap">ENTRAR NA PARTIDA 3v3</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </main>

      {/* Footer Info */}
      <footer className="text-center text-xs text-slate-500 border-t border-slate-800/80 pt-4 w-full max-w-4xl">
        Barra Bandeira - MVP · Compatível com projeto Unity 6.3 LTS (salvo-projeto)
      </footer>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-2xl font-black text-white font-display mb-4 flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-amber-400" />
              <span>Regras — Barra Bandeira MVP</span>
            </h2>

            <div className="space-y-4 text-xs md:text-sm text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <strong className="text-amber-300 block mb-1">1. Ataque & Vitória:</strong>
                Ao cruzar para o campo inimigo, você corre o risco de ser congelado se for tocado por um adversário. Vence a equipe que trouxer as 3 bandeiras adversárias para a própria base primeiro.
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <strong className="text-cyan-300 block mb-1">2. Defesa:</strong>
                No seu lado do campo, toque nos inimigos para congelá-los no lugar.
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <strong className="text-emerald-300 block mb-1">3. Resgate ("SALVO!"):</strong>
                Jogadores congelados podem ser liberados pela granada descongelante da <strong>Luppy</strong> ou pelo toque de um aliado no campo.
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <strong className="text-purple-300 block mb-1">4. Personagens e Habilidades (Barra de Espaço):</strong>
                <ul className="list-disc list-inside mt-1 space-y-1 text-slate-300">
                  <li><strong>Bobby (Escudeiro):</strong> Fica imune a ser congelado por toque durante 6 segundos.</li>
                  <li><strong>Silver (Velocista):</strong> Executa um dash rápido de 5 metros para frente.</li>
                  <li><strong>Luppy (Suporte):</strong> Lança uma granada descongelante (área de 4m). <em>Atenção: se mal posicionada, pode descongelar inimigos também!</em></li>
                </ul>
              </div>

              <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
                <strong className="text-white block mb-1">5. Controles:</strong>
                WASD ou Setas para mover · Barra de Espaço para habilidade · Mouse para mirar a granada da Luppy · Câmera alternável entre 3ª pessoa e Visão Aérea.
              </div>
            </div>

            <button
              onClick={() => setShowHowToPlay(false)}
              className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition-colors cursor-pointer"
            >
              Entendi, vamos jogar!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
