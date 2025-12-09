import React, { useState } from 'react';
import { Search, Loader2, Heart, Sparkles } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input.trim());
    }
  };

  const suggestions = [
    { text: "Serendipity", color: "bg-amber-100 text-amber-600 border-amber-200 hover:bg-amber-200" },
    { text: "Simultaneously", color: "bg-sky-100 text-sky-600 border-sky-200 hover:bg-sky-200" },
    { text: "Proposal", color: "bg-emerald-100 text-emerald-600 border-emerald-200 hover:bg-emerald-200" }
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-8 px-4">
      <form onSubmit={handleSubmit} className="relative group transform transition-all hover:scale-[1.01]">
        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none z-10">
          {isLoading ? (
            <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
          ) : (
            <Search className="h-6 w-6 text-indigo-300" />
          )}
        </div>
        <input
          type="text"
          className="block w-full pl-16 pr-36 py-5 bg-white border-4 border-indigo-50 rounded-full text-lg font-bold text-gray-600 placeholder:text-indigo-200 focus:outline-none focus:border-indigo-200 transition-all shadow-xl shadow-indigo-100/40"
          placeholder="Type a word to start..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="absolute right-2.5 top-2.5 bottom-2.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white px-7 rounded-full font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 shadow-lg shadow-purple-200 flex items-center gap-2"
        >
           {isLoading ? '...' : 'Go!'} <Sparkles className="w-4 h-4 fill-white/20" />
        </button>
      </form>
      <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm font-bold">
        <span className="py-2 flex items-center gap-1 text-gray-400"><Heart className="w-4 h-4 text-pink-400 fill-pink-400" /> Try:</span> 
        {suggestions.map((item) => (
            <button 
                key={item.text}
                type="button"
                className={`px-5 py-2 rounded-2xl border-2 transition-all shadow-sm hover:-translate-y-1 ${item.color}`}
                onClick={() => {setInput(item.text); onSearch(item.text);}}
            >
                {item.text}
            </button>
        ))}
      </div>
    </div>
  );
};