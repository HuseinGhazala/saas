import React from 'react';
import { XCircle, Loader2, ExternalLink } from 'lucide-react';

export default function WinnerModal({
  show,
  onClose,
  winner,
  aiContent,
  isLoadingAI,
  onCopy,
  copied,
  remainingSpins,
  websiteUrl
}) {
  if (!show || !winner) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center relative shadow-2xl transform scale-100 transition-all border-8 border-yellow-400">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors">
          <XCircle size={24} />
        </button>
        <div className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-xl border-4 border-white text-white" style={{ backgroundColor: winner.color }}>
          {winner.type === 'luck' ? '😔' : '🎉'}
        </div>
        <h2 className="text-3xl font-black mb-2 text-slate-800">{winner.type === 'luck' ? 'يا خسارة!' : 'مبروك عليك!'}</h2>
        <div className="mb-6">
          {winner.type === 'luck' ? (
            <p className="text-slate-500 font-medium">حاول مرة تانية، أكيد هتكسب!</p>
          ) : (
            <div className="w-full">
              <p className="text-xl font-bold text-slate-800 mb-2">{winner.text}</p>
              {isLoadingAI ? (
                <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 py-2 rounded-lg animate-pulse">
                  <Loader2 className="animate-spin" size={16} /> جاري تجهيز الهدية...
                </div>
              ) : aiContent ? (
                <p className="text-sm text-slate-600 bg-yellow-50 p-2 rounded-lg border border-yellow-200 italic">"{aiContent.message}"</p>
              ) : null}
            </div>
          )}
        </div>
        {winner.type === 'prize' && (
          <>
            <div
              className={`p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer relative overflow-hidden group ${copied ? 'border-green-500 bg-green-50' : 'border-slate-300 hover:border-slate-400 bg-slate-50'}`}
              onClick={() => aiContent ? onCopy(aiContent.code) : null}
            >
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">اضغط للنسخ</p>
              {isLoadingAI ? (
                <div className="h-8 w-32 bg-slate-200 mx-auto rounded animate-pulse"></div>
              ) : (
                <code className="text-2xl font-black tracking-widest text-slate-800">{aiContent ? aiContent.code : "..."}</code>
              )}
              {copied && <div className="absolute inset-0 flex items-center justify-center bg-green-500/90 text-white font-bold">تم النسخ!</div>}
            </div>
            {websiteUrl && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 w-full py-3 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 animate-fade-in-up"
              >
                <ExternalLink size={18} /> تسوق الآن واستخدم الكوبون
              </a>
            )}
          </>
        )}
        <button onClick={onClose} className="mt-4 w-full py-3 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all">
          {remainingSpins > 0 ? 'لف تاني' : 'انهاء اللعبة'}
        </button>
      </div>
    </div>
  );
}
