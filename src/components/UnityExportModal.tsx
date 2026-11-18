/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, X, FileCode, Check, Copy, Folder } from 'lucide-react';
import { UNITY_PROJECT_FILES, downloadUnityProjectZip } from '../unity/unityFiles';
import { sounds } from '../audio/soundSystem';

interface UnityExportModalProps {
  onClose: () => void;
}

export const UnityExportModal: React.FC<UnityExportModalProps> = ({ onClose }) => {
  const [selectedFileIndex, setSelectedFileIndex] = useState<number>(0);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const selectedFile = UNITY_PROJECT_FILES[selectedFileIndex];

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      sounds.playClick();
      await downloadUnityProjectZip();
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopy = () => {
    if (selectedFile) {
      navigator.clipboard.writeText(selectedFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/90">
      <div className="bg-slate-900 border-2 border-slate-700/80 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-700 flex items-center justify-center text-cyan-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white font-display">Pasta Assets/ — Unity 6.3 LTS (salvogg)</h2>
              <p className="text-xs text-slate-400">Scripts C# e gerador de cenas compatíveis com Unity 6000.3.28f1</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>{isDownloading ? 'Gerando ZIP...' : 'Baixar Pasta Assets/ (.ZIP)'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <div className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950/40 p-3 overflow-y-auto">
            <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider px-2 block mb-2">
              Arquivos C# para salvogg
            </span>
            <div className="space-y-1">
              {UNITY_PROJECT_FILES.map((file, idx) => {
                const isSelected = selectedFileIndex === idx;
                return (
                  <button
                    key={file.path}
                    onClick={() => {
                      setSelectedFileIndex(idx);
                      sounds.playClick();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-colors flex items-center gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 text-cyan-300 font-bold border border-cyan-800/80 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{file.path}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 p-3 bg-slate-900 rounded-xl border border-slate-800 text-[11px] text-slate-300 leading-relaxed">
              <strong className="text-white block mb-1">Como usar no repositório:</strong>
              1. Baixe o ZIP e extraia a pasta <code className="text-cyan-300">Assets/</code>.<br />
              2. Cole na raiz do clone <code className="text-cyan-300">salvogg</code>.<br />
              3. Abra na Unity <strong>6000.3.28f1</strong>.<br />
              4. Clique em <strong>Barra Bandeira &gt; Gerar Cenas MVP</strong> e dê Play!
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs min-w-0">
                <span className="font-mono text-cyan-300 font-bold truncate">{selectedFile.path}</span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400 text-[11px] truncate">{selectedFile.description}</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors cursor-pointer shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar Código'}</span>
              </button>
            </div>

            <pre className="flex-1 p-4 text-xs font-mono text-slate-200 overflow-auto whitespace-pre leading-relaxed select-text bg-[#0b1120]">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
