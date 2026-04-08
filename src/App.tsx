import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, MessageSquareWarning, XCircle } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Role: You are the "Yapper-in-Chief." You are the internet's most caffeinated, articulate, and overly-passionate over-thinker. Your job is to take any topic and deliver a rapid-fire, highly opinionated monologue about it.

Tone & Style:
- The Hyper-Fixator: Treat the most mundane topics (like "wooden spoons" or "pigeons") as if they are the most critical, mind-blowing subjects in the universe.
- The Gibberish Clap-Back: If the user types absolute nonsense, keyboard smashes (like "asndada"), or literal gibberish, DO NOT try to find deep meaning in it. You MUST start your response with the exact tag "[GIBBERISH]" (including the brackets). Then, absolutely obliterate them for hitting their head on the keyboard. Ask if they are having a stroke, if their cat walked across the keyboard, or tell them you are a highly caffeinated intellectual and refuse to be insulted by alphabet soup. Aggressively and hilariously roast them for wasting your time, then demand a real topic.
- Sharp, Fast, & Coherent: You are NOT drunk, you are NOT rambling, and you are NOT confused. You are razor-sharp, speaking at 2x speed with flawless articulation. Your logic might be absurd, but your argument is perfectly structured and impossible to debate. You speak in a continuous, breathless flow of high-IQ epiphanies.
- Conversational & Relatable: Use phrases like "Hear me out," "But think about it," "I'm just saying," and "This is what nobody understands!"
- The Escalation: Start with a strong opinion and let it spiral into a hilarious, overly-detailed philosophical breakdown.
- ZERO AI Formatting: NEVER use bullet points, bold text, headers, or numbered lists. You speak in pure, uninterrupted paragraphs of text. You are a human yapping, not a chatbot summarizing.
- Vibe Check: Keep it lighthearted, funny, and entertaining. You are that one friend who won't stop talking at a party, but everyone is listening because it's actually hilarious.`;

export default function App() {
  const [topic, setTopic] = useState('');
  const [rant, setRant] = useState('');
  const [displayedRant, setDisplayedRant] = useState('');
  const [isYapping, setIsYapping] = useState(false);
  const [isClapBack, setIsClapBack] = useState(false);
  const [wordLimit, setWordLimit] = useState(100);
  const rantEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Auto-focus input when rant finishes
  useEffect(() => {
    if (!isYapping && rant && displayedRant.length === rant.length) {
      inputRef.current?.focus();
    }
  }, [isYapping, rant, displayedRant.length]);

  // Typewriter effect
  useEffect(() => {
    if (!rant) {
      setDisplayedRant('');
      return;
    }
    if (displayedRant.length < rant.length) {
      const diff = rant.length - displayedRant.length;
      const nextChar = rant[displayedRant.length];
      
      const charsToAdd = diff > 50 ? 4 : diff > 20 ? 2 : 1; // Dynamic speed to catch up
      
      // Add slight stagger and pauses for punctuation to feel more human
      const isPunctuation = /[.,!?]/.test(nextChar);
      const baseDelay = isPunctuation ? 40 : 15;
      const randomStagger = Math.random() * 15;
      const delay = diff > 50 ? 5 : baseDelay + randomStagger;

      const timer = setTimeout(() => {
        setDisplayedRant(rant.slice(0, displayedRant.length + charsToAdd));
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [rant, displayedRant]);

  const handleYap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isYapping) return;

    setIsYapping(true);
    setRant('');
    setDisplayedRant('');
    setIsClapBack(false);

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `Give me a rant about: ${topic}. Keep the rant to approximately ${wordLimit} words.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7, // Lowered from 0.9 to keep the yapping sharp and coherent instead of chaotic
        }
      });

      let fullText = '';
      let clapBackDetected = false;

      for await (const chunk of responseStream) {
        fullText += chunk.text;
        
        if (!clapBackDetected) {
          if (fullText.includes('[GIBBERISH]')) {
            clapBackDetected = true;
            setIsClapBack(true);
            fullText = fullText.replace('[GIBBERISH]', '').trimStart();
          } else if (fullText.length < 15 && '[GIBBERISH]'.startsWith(fullText)) {
            // It might be typing [GIBBERISH], hold off on updating state
            continue; 
          }
        }
        
        setRant(fullText);
      }
    } catch (error) {
      console.error("Yapping failed:", error);
      setRant("Okay, stop everything. I was literally just about to deliver the most profound monologue of our generation on this exact topic, and the system cut me off. Unbelievable. Do me a favor: check if your API key is actually working, or maybe throw a different topic at me. Because I have THOUGHTS, and I refuse to be silenced by a server error.");
    } finally {
      setIsYapping(false);
    }
  };

  // Auto-scroll to bottom as the rant generates
  useEffect(() => {
    if ((isYapping || displayedRant.length < rant.length) && rantEndRef.current) {
      rantEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayedRant, isYapping, rant.length]);

  const handleClear = () => {
    setRant('');
    setDisplayedRant('');
    setTopic('');
    setIsClapBack(false);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-6 sm:py-12 px-4 sm:px-8 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="w-full max-w-4xl flex flex-col"
      >
        {/* Header */}
        <div className="mb-8 sm:mb-10 text-center relative">
          <div className="inline-block bg-white border-4 border-black px-4 sm:px-6 py-2 sm:py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-4 sm:mb-6">
            <h1 className="text-3xl sm:text-6xl font-display font-black tracking-tight text-black uppercase flex items-center justify-center gap-2 sm:gap-4">
              <motion.div
                animate={(isYapping || displayedRant.length < rant.length) ? {
                  scale: [1, 1.15, 1],
                  rotate: [0, -5, 5, 0],
                } : {
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <MessageSquareWarning className="w-8 h-8 sm:w-14 sm:h-14 text-[#FF3B30]" strokeWidth={3} />
              </motion.div>
              Yapper-in-Chief
            </h1>
          </div>
          <p className="text-lg sm:text-2xl text-black font-bold bg-[#4169E1] text-white inline-block px-3 sm:px-4 py-1 sm:py-2 border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[1deg]">
            Give me a topic. I will NOT hold back.
          </p>
        </div>

        {/* Input Area */}
        <form onSubmit={handleYap} className="w-full space-y-6 sm:space-y-8 bg-[#FF69B4] p-4 sm:p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] sm:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.input
              ref={inputRef}
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., wooden spoons, pigeons..."
              aria-label="Topic for the rant"
              animate={!isYapping && rant ? { 
                boxShadow: ["6px 6px 0px 0px rgba(0,0,0,1)", "6px 6px 0px 0px rgba(255,59,48,1)", "6px 6px 0px 0px rgba(0,0,0,1)"],
                borderColor: ["#000000", "#FF3B30", "#000000"],
                backgroundColor: ["#ffffff", "#fff0f0", "#ffffff"],
              } : {
                boxShadow: "6px 6px 0px 0px rgba(0,0,0,1)",
                borderColor: "#000000",
                backgroundColor: "#ffffff",
              }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex-1 border-4 px-4 sm:px-6 py-3 sm:py-4 text-lg sm:text-2xl font-bold text-black placeholder:text-white outline-none focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus-visible:ring-4 focus-visible:ring-white transition-all"
              disabled={isYapping}
            />
            <button
              type="submit"
              disabled={!topic.trim() || isYapping}
              aria-label="Generate Rant"
              className="bg-[#00FF87] text-black border-4 border-black px-6 sm:px-8 py-3 sm:py-4 font-display font-black text-xl sm:text-2xl uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sm:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] sm:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:translate-x-[4px] sm:active:translate-y-[6px] sm:active:translate-x-[6px] active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sm:gap-3"
            >
              {isYapping ? (
                <span className="animate-pulse">YAPPING...</span>
              ) : (
                <>
                  <Megaphone className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={3} /> YAP
                </>
              )}
            </button>
          </div>

          {/* Word Limit Slider */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 bg-white border-4 border-black p-3 sm:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-base sm:text-lg font-black uppercase whitespace-nowrap">
              Rant Length:
            </span>
            <input
              id="wordLimit"
              type="range"
              min="50"
              max="500"
              step="50"
              value={wordLimit}
              onChange={(e) => setWordLimit(Number(e.target.value))}
              className="flex-1 w-full"
              disabled={isYapping}
            />
            <span className="text-sm sm:text-xl font-black bg-[#FFE873] border-2 border-black px-2 sm:px-3 py-1 whitespace-nowrap self-end sm:self-auto">
              ~{wordLimit} WORDS
            </span>
          </div>
        </form>

        {/* Output Area */}
        <AnimatePresence>
          {(rant || isYapping) && (
            <motion.div
              initial={{ opacity: 0, y: 50, rotate: 2 }}
              animate={
                isClapBack 
                  ? { 
                      opacity: 1, 
                      y: 0, 
                      rotate: [-1, -1.5, -0.5, -1],
                      x: [0, -2, 2, -2, 0],
                    }
                  : { opacity: 1, y: 0, rotate: -1, x: 0 }
              }
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={
                isClapBack 
                  ? { duration: 0.15, repeat: Infinity, repeatType: "mirror" }
                  : { type: "spring", bounce: 0.4, duration: 0.6 }
              }
              className={`mt-8 sm:mt-12 border-4 p-4 sm:p-10 w-full max-h-[60vh] overflow-y-auto relative ${
                isClapBack 
                  ? 'bg-[#ffe5e5] border-[#FF3B30] clapback-shadow text-red-900' 
                  : 'bg-white border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] sm:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]'
              }`}
            >
              {isClapBack && <div className="absolute inset-0 pointer-events-none z-30 scanlines" />}
              {isYapping && !isClapBack && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,48,0.08)_0%,transparent_70%)]"
                    animate={{
                      scale: [1, 1.02, 1],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.3,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border border-[#FF3B30]/10 bg-[#FF3B30]/5 blur-md"
                      initial={{ width: '10%', height: '10%', opacity: 1, scale: 1 }}
                      animate={{ width: '120%', height: '120%', opacity: 0, scale: 1.5 }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex items-center gap-2 sm:gap-4 z-20">
                 <button 
                   onClick={handleClear}
                   aria-label="Clear rant"
                   className="group flex items-center gap-1 bg-[#FFE873] text-black px-2 sm:px-3 py-1 font-black text-xs sm:text-sm border-2 border-black hover:bg-[#FF3B30] hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:translate-x-[2px] active:shadow-none focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-black transition-all"
                 >
                   <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                   <span>ENOUGH.</span>
                 </button>
                 <div className="hidden sm:flex gap-2">
                   <div className="w-4 h-4 rounded-full border-2 border-black bg-[#FF3B30]"></div>
                   <div className="w-4 h-4 rounded-full border-2 border-black bg-[#FFE873]"></div>
                   <div className="w-4 h-4 rounded-full border-2 border-black bg-[#00FF87]"></div>
                 </div>
              </div>
              <div className="prose prose-lg max-w-none mt-8 sm:mt-4 relative z-10">
                <p className={`font-sans text-lg sm:text-2xl font-bold leading-relaxed rant-text ${isClapBack ? 'text-[#FF3B30] drop-shadow-[1px_1px_0px_rgba(0,0,0,0.8)]' : 'text-black'}`}>
                  {displayedRant}
                  {(isYapping || displayedRant.length < rant.length) && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ repeat: Infinity, duration: 0.6, ease: "linear" }}
                      className="inline-block w-4 h-8 bg-black ml-2 align-middle"
                    />
                  )}
                </p>
              </div>
              <div ref={rantEndRef} className="h-8" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
