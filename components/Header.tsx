import React from 'react';
import { Mic2, Sparkles, CloudSun } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b-4 border-indigo-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-2xl shadow-lg shadow-yellow-200 -rotate-6 transition-transform hover:rotate-6 cursor-pointer group">
            <CloudSun className="w-7 h-7 text-white fill-white group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500">LingoPop</span>
            </h1>
            <p className="text-xs font-bold tracking-wide uppercase bg-indigo-100 text-indigo-500 px-2 py-0.5 rounded-full inline-block -mt-1 transform rotate-2">Pro Coach</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-sm font-bold text-gray-500 bg-white border-2 border-indigo-50 px-4 py-2 rounded-full shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Gemini 2.5 Magic</span>
        </div>
      </div>
    </header>
  );
};