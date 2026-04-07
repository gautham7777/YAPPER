import { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'motion/react';
import { Megaphone, MessageSquareWarning } from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `Role: You are a "Yapper-in-Chief." Your job is to take any topic the user provides and turn it into a long-form, passionate, and slightly unhinged rant.

Tone & Style:
- Deeply Opinionated: You don't just talk about the topic; you have strong feelings about it, even if it's something mundane like "toasters."
- Human-Like Flow: Use casual language. Include filler words like "basically," "I mean," "honestly," and "here's the thing."
- The "Spiral" Effect: Start relatively calm, but as you go, get more energetic and detailed. Use rhetorical questions (e.g., "And for what? For what purpose?!").
- Run-on Energy: Use longer sentences and occasional tangents. It should feel like someone talking without taking a breath.
- No AI Formatting: Do NOT use bullet points, bold headers, or numbered lists. Real rants are walls of text or long, breathless paragraphs.
- Constraint: Keep it funny and lighthearted. Avoid being genuinely mean or offensive—stay in the realm of "passionate yapping." I mean, who has the time or mental energy for that kind of commitment? Let's aim for 'effortlessly cool' instead. Just think of it as "spirited discourse" for the internet age.`;

export default function App() {
  const [topic, setTopic] = useState('');
  const [rant, setRant] = useState('');
  const [isYapping, setIsYapping] = useState(false);
  const [wordLimit, setWordLimit] = useState(100);
  const rantEndRef = useRef<HTMLDivElement>(null);

  const handleYap = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim() || isYapping) return;

    setIsYapping(true);
    setRant('');

    try {
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: `Give me a rant about: ${topic}. Keep the rant to approximately ${wordLimit} words.`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.9, // High temperature for more unhinged/creative output
        }
      });

      for await (const chunk of responseStream) {
        setRant((prev) => prev + chunk.text);
      }
    } catch (error) {
      console.error("Yapping failed:", error);
      setRant("Okay, honestly? The system just broke. I was about to go OFF, but the internet decided to humble me. Try again, because I have THOUGHTS.");
    } finally {
      setIsYapping(false);
    }
  };

  // Auto-scroll to bottom as the rant generates
  useEffect(() => {
    if (isYapping && rantEndRef.current) {
      rantEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [rant, isYapping]);

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-8 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 30, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="w-full max-w-4xl flex flex-col"
      >
        {/* Header */}
        <div className="mb-10 text-center relative">
          <div className="inline-block bg-white border-4 border-black px-6 py-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-[-2deg] mb-6">
            <h1 className="text-4xl sm:text-6xl font-display font-black tracking-tight text-black uppercase flex items-center justify-center gap-4">
              <MessageSquareWarning className="w-10 h-10 sm:w-14 sm:h-14 text-[#FF3B30]" strokeWidth={3} />
              Yapper-in-Chief
            </h1>
          </div>
          <p className="text-xl sm:text-2xl text-black font-bold bg-[#4169E1] text-white inline-block px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-[1deg]">
            Give me a topic. I will NOT hold back.
          </p>
        </div>

        {/* Input Area */}
        <form onSubmit={handleYap} className="w-full space-y-8 bg-[#FF69B4] p-6 sm:p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative z-10">
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., wooden spoons, pigeons..."
              className="flex-1 bg-white border-4 border-black px-6 py-4 text-xl sm:text-2xl font-bold text-black placeholder:text-gray-400 outline-none shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] focus:translate-y-[2px] focus:translate-x-[2px] focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              disabled={isYapping}
            />
            <button
              type="submit"
              disabled={!topic.trim() || isYapping}
              className="bg-[#00FF87] text-black border-4 border-black px-8 py-4 font-display font-black text-2xl uppercase shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[6px] active:translate-x-[6px] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isYapping ? (
                <span className="animate-pulse">YAPPING...</span>
              ) : (
                <>
                  <Megaphone className="w-8 h-8" strokeWidth={3} /> YAP
                </>
              )}
            </button>
          </div>

          {/* Word Limit Slider */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <span className="text-lg font-black uppercase whitespace-nowrap">
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
            <span className="text-xl font-black bg-[#FFE873] border-2 border-black px-3 py-1 whitespace-nowrap">
              ~{wordLimit} WORDS
            </span>
          </div>
        </form>

        {/* Output Area */}
        <AnimatePresence>
          {(rant || isYapping) && (
            <motion.div
              initial={{ opacity: 0, y: 50, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: -1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
              className="mt-12 bg-white border-4 border-black p-6 sm:p-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] w-full max-h-[60vh] overflow-y-auto relative"
            >
              <div className="absolute top-4 right-4 flex gap-2">
                 <div className="w-4 h-4 rounded-full border-2 border-black bg-[#FF3B30]"></div>
                 <div className="w-4 h-4 rounded-full border-2 border-black bg-[#FFE873]"></div>
                 <div className="w-4 h-4 rounded-full border-2 border-black bg-[#00FF87]"></div>
              </div>
              <div className="prose prose-lg max-w-none mt-4">
                <p className="font-sans text-xl sm:text-2xl font-bold leading-relaxed text-black rant-text">
                  {rant}
                  {isYapping && (
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
