import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Mic, Volume2, RotateCcw, CheckCircle2, AlertCircle, Video, Loader2, Sparkles, PartyPopper } from 'lucide-react';
import { SentenceContext, PronunciationFeedback } from '../types';
import { generateSpeech, analyzePronunciation, generateContextVideo } from '../services/geminiService';
import { decodeAudioData, blobToBase64 } from '../services/audioUtils';

interface PracticeCardProps {
  sentence: SentenceContext;
  isActive: boolean;
  index: number;
}

const getVoiceForTone = (tone: string, context: string): string => {
  const t = tone.toLowerCase();
  const c = context.toLowerCase();
  
  if (t.includes('serious') || c.includes('business')) return 'Fenrir';
  if (t.includes('calm') || c.includes('academic')) return 'Zephyr';
  if (t.includes('excited') || t.includes('cheerful')) return 'Kore';
  return 'Puck'; 
};

export const PracticeCard: React.FC<PracticeCardProps> = ({ sentence, isActive, index }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PronunciationFeedback | null>(null);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    return () => {
      audioContextRef.current?.close();
      audioContextRef.current = null;
    };
  }, []);

  const handlePlayReference = async () => {
    try {
      if (isPlaying) return;
      setIsPlaying(true);
      setError(null);

      if (audioContextRef.current?.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      const voice = getVoiceForTone(sentence.tone, sentence.contextType);
      const base64Audio = await generateSpeech(sentence.english, voice);
      if (!audioContextRef.current) return;

      const audioBuffer = await decodeAudioData(base64Audio, audioContextRef.current);
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => setIsPlaying(false);
      source.start();
    } catch (err) {
      console.error(err);
      setError("Failed to play audio. Please try again.");
      setIsPlaying(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (isGeneratingVideo || videoUrl) return;
    setIsGeneratingVideo(true);
    setError(null);
    try {
      const url = await generateContextVideo(sentence.english);
      setVideoUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to generate video. Veo might be busy.");
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAnalyze(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setFeedback(null);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalyze = async (audioBlob: Blob) => {
    setIsAnalyzing(true);
    try {
      const base64Audio = await blobToBase64(audioBlob);
      const result = await analyzePronunciation(base64Audio, sentence.english, audioBlob.type);
      setFeedback(result);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze pronunciation. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderEnglishText = () => {
    if (!feedback) return <p className="text-2xl font-bold text-gray-700 mb-2 leading-relaxed tracking-tight">{sentence.english}</p>;

    const words = sentence.english.split(' ');
    return (
      <p className="text-2xl font-bold text-gray-700 mb-2 leading-relaxed tracking-tight">
        {words.map((word, idx) => {
          const isIssue = feedback.highlightedWordIndices.includes(idx);
          return (
            <span key={idx} className={isIssue ? "text-rose-500 decoration-4 underline decoration-rose-300" : "text-emerald-600"}>
              {word}{' '}
            </span>
          );
        })}
      </p>
    );
  };

  // Colorful UI Classes
  const cardStyle = "bg-white rounded-[2.5rem] p-8 shadow-[0_15px_35px_-10px_rgba(100,100,200,0.15)] border-[3px] border-white ring-4 ring-indigo-50/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_20px_40px_-10px_rgba(100,100,200,0.2)] relative overflow-visible";
  
  const btnBase = "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-md";
  
  // Listen - Blue/Sky
  const btnListen = `${btnBase} bg-gradient-to-tr from-sky-400 to-blue-500 text-white shadow-blue-200`;
  
  // Practice - Mint/Emerald
  const btnPractice = `${btnBase} bg-gradient-to-tr from-emerald-400 to-teal-500 text-white shadow-emerald-200`;
  
  // Stop - Rose/Red
  const btnStop = `${btnBase} bg-gradient-to-tr from-rose-400 to-red-500 text-white shadow-rose-200 animate-pulse`;

  const badgeBase = "inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold shadow-sm border-2";

  return (
    <div className={cardStyle}>
      {/* Index Number Blob */}
      <div className="absolute -left-3 -top-3 w-12 h-12 bg-gradient-to-br from-yellow-300 to-orange-400 rounded-2xl rotate-12 flex items-center justify-center text-white font-extrabold text-xl shadow-lg border-4 border-white z-20">
        {index + 1}
      </div>

      {/* Header Tags */}
      <div className="flex justify-between items-start mb-6 relative z-10 pl-8">
        <div className="flex gap-2 flex-wrap">
          <span className={`${badgeBase} bg-violet-50 text-violet-600 border-violet-100`}>
            {sentence.contextType}
          </span>
          <span className={`${badgeBase} bg-pink-50 text-pink-600 border-pink-100`}>
            {sentence.tone}
          </span>
        </div>
        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg uppercase tracking-wider">{sentence.difficulty}</span>
      </div>

      {/* Video Content */}
      {videoUrl ? (
        <div className="mb-8 rounded-[2rem] overflow-hidden shadow-2xl shadow-indigo-200 border-8 border-white bg-black">
          <video src={videoUrl} controls className="w-full" autoPlay muted />
        </div>
      ) : isGeneratingVideo ? (
        <div className="mb-8 h-48 rounded-[2rem] bg-indigo-50 border-4 border-dashed border-indigo-200 flex flex-col items-center justify-center text-indigo-400 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
          <span className="text-sm font-bold bg-white px-4 py-2 rounded-full shadow-sm">Painting pixels...</span>
        </div>
      ) : null}

      {/* Text Content */}
      <div className="mb-8 pl-2 relative z-10">
        {renderEnglishText()}
        <p className="text-gray-400 text-lg font-medium">{sentence.chinese}</p>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-4 relative z-10">
        <button
          onClick={handlePlayReference}
          disabled={isPlaying || isRecording || isAnalyzing}
          className={btnListen}
        >
          {isPlaying ? <Volume2 className="w-5 h-5 animate-bounce" /> : <Play className="w-5 h-5 fill-current" />}
          Listen
        </button>

        {!isRecording ? (
          <button
            onClick={startRecording}
            disabled={isPlaying || isAnalyzing}
            className={btnPractice}
          >
            <Mic className="w-5 h-5 fill-current" />
            Practice
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className={btnStop}
          >
            <Square className="w-5 h-5 fill-current" />
            Stop
          </button>
        )}

        {!videoUrl && !isGeneratingVideo && (
           <button
           onClick={handleGenerateVideo}
           className="ml-auto px-5 py-2.5 rounded-2xl text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 hover:text-purple-700 hover:scale-105 flex items-center gap-2 transition-all"
           title="Create video"
         >
           <Video className="w-4 h-4" />
           Watch Video
         </button>
        )}
      </div>

      {/* Loading State for Analysis */}
      {isAnalyzing && (
        <div className="mt-6 flex items-center gap-3 text-indigo-600 bg-indigo-50 p-4 rounded-2xl border border-indigo-100 animate-pulse">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-bold">Analyzing your magic...</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 flex items-start gap-2 text-rose-500 bg-rose-50 p-3 rounded-2xl text-sm border border-rose-100">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Feedback Section */}
      {feedback && !isAnalyzing && (
        <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-extrabold text-gray-700 text-lg flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-amber-400" /> Feedback
            </h4>
            <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${
              feedback.score >= 80 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
              feedback.score >= 60 ? 'bg-amber-100 text-amber-700 border border-amber-200' :
              'bg-rose-100 text-rose-700 border border-rose-200'
            }`}>
              {feedback.score >= 80 ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              Score: {feedback.score}
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-indigo-50/50 to-white rounded-2xl p-6 border-2 border-indigo-50 space-y-5">
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-indigo-300 block mb-1">Coach Says</span>
              <p className="text-indigo-900 text-sm font-semibold leading-relaxed">{feedback.advice}</p>
            </div>
            
            {feedback.phonemeIssues.length > 0 && (
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-300 block mb-2">Watch Out For</span>
                <div className="flex flex-wrap gap-2">
                  {feedback.phonemeIssues.map((ph, i) => (
                    <span key={i} className="px-4 py-1.5 rounded-xl text-sm font-bold text-gray-600 bg-white border-2 border-gray-100 shadow-sm">
                      /{ph}/
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-5 flex justify-end">
             <button 
               onClick={() => setFeedback(null)}
               className="text-xs font-bold text-gray-400 hover:text-indigo-500 flex items-center gap-1 transition-colors px-3 py-1 rounded-lg hover:bg-indigo-50"
             >
               <RotateCcw className="w-3 h-3" />
               Try Again
             </button>
          </div>
        </div>
      )}
    </div>
  );
};