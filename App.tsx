import React, { useState } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { PracticeCard } from './components/PracticeCard';
import { generateContexts } from './services/geminiService';
import { SentenceContext, AppState } from './types';
import { BookOpen, Sparkles, MonitorPlay, Heart } from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.IDLE);
  const [sentences, setSentences] = useState<SentenceContext[]>([]);
  const [currentQuery, setCurrentQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setState(AppState.GENERATING_CONTEXT);
    setCurrentQuery(query);
    setError(null);
    setSentences([]);

    try {
      const results = await generateContexts(query);
      setSentences(results);
      setState(AppState.READY_TO_PRACTICE);
    } catch (err) {
      console.error(err);
      setError("Unable to generate content. Please check your connection or try a different word.");
      setState(AppState.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF8F0] flex flex-col pb-12 font-sans selection:bg-yellow-200">
      <Header />
      
      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col mt-8">
        <div className="text-center mt-6 mb-8 px-4 relative">
            {/* Background Decorations */}
            <div className="absolute top-0 left-10 w-16 h-16 bg-yellow-200 rounded-full opacity-50 blur-xl animate-pulse"></div>
            <div className="absolute bottom-0 right-10 w-20 h-20 bg-pink-200 rounded-full opacity-50 blur-xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-indigo-100 rounded-full opacity-30 blur-3xl -z-10 transform -translate-x-1/2 -translate-y-1/2"></div>
            
          <h2 className="text-4xl sm:text-6xl font-extrabold text-gray-800 tracking-tight mb-4 leading-tight">
            Learn English <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">With Joy & Color</span>
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto font-bold">
            Master pronunciation with <span className="text-indigo-400">AI magic</span>, <span className="text-pink-400">emotional tones</span>, and <span className="text-amber-400">colorful feedback</span>!
          </p>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={state === AppState.GENERATING_CONTEXT} />

        {/* Content Area */}
        <div className="px-4 flex-1">
          
          {state === AppState.IDLE && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: Heart, title: "Feelings", desc: "Sentences with real emotions.", color: "bg-pink-50 text-pink-500" },
                { icon: MonitorPlay, title: "Veo Video", desc: "Watch magic happen with AI video.", color: "bg-purple-50 text-purple-500" },
                { icon: BookOpen, title: "Feedback", desc: "Gentle corrections for you.", color: "bg-emerald-50 text-emerald-500" }
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center text-center p-8 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-100/30 border-2 border-white hover:-translate-y-2 transition-transform duration-300">
                  <div className={`p-5 rounded-3xl mb-5 ${feature.color} shadow-sm`}>
                    <feature.icon className="w-8 h-8 fill-current opacity-80" />
                  </div>
                  <h3 className="font-extrabold text-gray-700 mb-2 text-xl">{feature.title}</h3>
                  <p className="text-sm text-gray-400 font-bold leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          )}

          {state === AppState.ERROR && (
            <div className="text-center py-12 bg-white rounded-[2.5rem] shadow-sm border-2 border-rose-100 mx-4">
              <div className="inline-block p-4 bg-rose-50 rounded-full mb-4">
                  <Sparkles className="w-8 h-8 text-rose-400" />
              </div>
              <p className="text-rose-500 font-bold mb-2 text-xl">Oopsie Daisy!</p>
              <p className="text-gray-400 font-medium">{error}</p>
            </div>
          )}

          {state === AppState.READY_TO_PRACTICE && sentences.length > 0 && (
            <div className="space-y-10 animate-in fade-in duration-700 slide-in-from-bottom-8 pb-12">
              <div className="flex items-center justify-center mb-6">
                <span className="bg-white px-6 py-2 rounded-2xl text-gray-400 font-bold shadow-sm border-2 border-indigo-50">
                  Magic results for "<span className="text-indigo-400">{currentQuery}</span>"
                </span>
              </div>
              
              <div className="grid grid-cols-1 gap-10">
                {sentences.map((sentence, index) => (
                  <PracticeCard 
                    key={sentence.id} 
                    sentence={sentence} 
                    isActive={true}
                    index={index}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto py-8 text-center text-gray-300 text-sm font-bold">
        <p className="flex items-center justify-center gap-2">
          Made with <Heart className="w-4 h-4 text-pink-300 fill-pink-300" /> & Color
        </p>
      </footer>
    </div>
  );
};

export default App;