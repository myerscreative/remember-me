"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { GameHeader } from "@/components/game/GameHeader";
import { ProgressBar } from "@/components/game/ProgressBar";
import { ResultsScreen } from "@/components/game/ResultsScreen";
import { WebRecallQuestion } from "@/app/actions/game-web-recall";
import { useRouter } from "next/navigation";

interface WebRecallGameProps {
  questions: WebRecallQuestion[];
  onComplete: (score: number, correctCount: number) => void;
}

export function WebRecallGame({ questions, onComplete }: WebRecallGameProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'complete'>('playing');
  const [showGardenHealth, setShowGardenHealth] = useState(false);

  const currentQuestion = questions[currentIndex];

  const handleNextQuestion = useCallback(() => {
    if (currentIndex + 1 >= questions.length) {
      setGameStatus('complete');
      onComplete(score, correctAnswers);
    } else {
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(30);
      setSelectedAnswer(null);
      setShowFeedback(false);
    }
  }, [currentIndex, questions.length, onComplete, score, correctAnswers]);

  // Timer logic
  useEffect(() => {
    if (gameStatus !== 'playing' || showFeedback) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleNextQuestion();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, showFeedback, handleNextQuestion]);

  const handleAnswer = useCallback((index: number) => {
    if (showFeedback || !currentQuestion) return;

    const isCorrect = currentQuestion.options[index] === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      const points = 100 + (timeLeft > 20 ? 50 : 0);
      setScore(s => s + points);
      setCorrectAnswers(c => c + 1);
      setStreak(s => s + 1);
      setShowGardenHealth(true);
      setTimeout(() => setShowGardenHealth(false), 2000);
    } else {
      setStreak(0);
    }

    setSelectedAnswer(index);
    setShowFeedback(true);

    setTimeout(() => {
      handleNextQuestion();
    }, 1500);
  }, [showFeedback, currentQuestion, timeLeft, handleNextQuestion]);

  if (gameStatus === 'complete') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <ResultsScreen
          score={score}
          correctAnswers={correctAnswers}
          totalQuestions={questions.length}
          streak={streak}
          onPlayAgain={() => window.location.reload()}
          onBackToMenu={() => router.push('/practice')}
          primaryColor="indigo"
        />
      </div>
    );
  }

  if (!currentQuestion) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <p className="text-white">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4">
      <GameHeader
        score={score}
        streak={streak}
        timeLeft={timeLeft}
        onBack={() => router.push('/practice')}
      />

      <ProgressBar
        current={currentIndex + 1}
        total={questions.length}
        colorFrom="from-indigo-500"
        colorTo="to-purple-500"
      />

      <main className="max-w-2xl mx-auto mt-8 flex flex-col items-center">
        {/* Hero Visual: Floating Avatars & Connection Web */}
        <div className="relative w-full h-64 mb-12 flex items-center justify-center overflow-hidden">
          {/* Pulsating Line */}
          <motion.div
            className={`absolute h-1 rounded-full ${showFeedback ? (currentQuestion.options[selectedAnswer!] === currentQuestion.correctAnswer ? 'bg-green-500' : 'bg-orange-500') : 'bg-indigo-500'}`}
            initial={{ width: 0, opacity: 0.5 }}
            animate={{ 
              width: "200px", 
              opacity: [0.4, 0.8, 0.4],
              boxShadow: showFeedback ? (currentQuestion.options[selectedAnswer!] === currentQuestion.correctAnswer ? "0 0 20px #22c55e" : "0 0 20px #f97316") : "0 0 20px #6366f1"
            }}
            transition={{ 
              opacity: { repeat: Infinity, duration: 2 },
              width: { duration: 0.5 }
            }}
          />

          {/* Contact A */}
          <motion.div
            className="absolute left-[calc(50%-140px)] z-10"
            animate={{ 
              y: [0, -10, 0],
              scale: showFeedback && currentQuestion.options[selectedAnswer!] === currentQuestion.correctAnswer ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 4, ease: "easeInOut" },
              scale: { duration: 0.5 }
            }}
          >
            <div className={`w-24 h-24 rounded-full border-4 ${showFeedback && currentQuestion.options[selectedAnswer!] === currentQuestion.correctAnswer ? 'border-green-500 shadow-[0_0_20px_#22c55e]' : 'border-slate-700'} overflow-hidden bg-slate-800 flex items-center justify-center transition-colors duration-300`}>
              {currentQuestion.contactA.photoUrl ? (
                <img src={currentQuestion.contactA.photoUrl} alt={currentQuestion.contactA.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{currentQuestion.contactA.firstName[0]}</span>
              )}
            </div>
            <p className="text-center mt-2 font-bold text-sm bg-slate-800/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              {currentQuestion.contactA.name}
            </p>
          </motion.div>

          {/* Contact B */}
          <motion.div
            className="absolute right-[calc(50%-140px)] z-10"
            animate={{ 
              y: [0, 10, 0],
              scale: showFeedback && currentQuestion.options[selectedAnswer!] === currentQuestion.correctAnswer ? [1, 1.1, 1] : 1
            }}
            transition={{ 
              y: { repeat: Infinity, duration: 3.5, ease: "easeInOut" },
              scale: { duration: 0.5 }
            }}
          >
            <div className={`w-24 h-24 rounded-full border-4 ${showFeedback && currentQuestion.options[selectedAnswer!] === currentQuestion.correctAnswer ? 'border-green-500 shadow-[0_0_20px_#22c55e]' : 'border-slate-700'} overflow-hidden bg-slate-800 flex items-center justify-center transition-colors duration-300`}>
              {currentQuestion.contactB.photoUrl ? (
                <img src={currentQuestion.contactB.photoUrl} alt={currentQuestion.contactB.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold">{currentQuestion.contactB.firstName[0]}</span>
              )}
            </div>
             <p className="text-center mt-2 font-bold text-sm bg-slate-800/80 px-2 py-1 rounded-lg backdrop-blur-sm">
              {currentQuestion.contactB.name}
            </p>
          </motion.div>

          {/* Feedback Indicators */}
          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                {currentQuestion.options[selectedAnswer!] === currentQuestion.correctAnswer ? (
                  <CheckCircle size={80} className="text-green-500" />
                ) : (
                  <XCircle size={80} className="text-red-500" />
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Garden Health Boost */}
          <AnimatePresence>
            {showGardenHealth && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: -60 }}
                exit={{ opacity: 0 }}
                className="absolute top-0 flex items-center gap-2 text-emerald-400 font-bold text-xl bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20 backdrop-blur-md"
              >
                <TrendingUp size={24} />
                +10 Garden Health
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Question Prompt */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            How are {currentQuestion.contactA.firstName} and {currentQuestion.contactB.firstName} connected?
          </h2>
          <p className="text-slate-400 font-medium italic">Identify the link to nurture their connection.</p>
        </div>

        {/* Choice Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          {currentQuestion.options.map((option, index) => {
            const isCorrect = option === currentQuestion.correctAnswer;
            const isSelected = selectedAnswer === index;
            
            let buttonStyles = "bg-slate-800 border-slate-700 text-slate-200 hover:border-indigo-500 hover:bg-slate-700";
            
            if (showFeedback) {
              if (isCorrect) {
                buttonStyles = "bg-green-900/30 border-green-500 text-green-100";
              } else if (isSelected) {
                buttonStyles = "bg-red-900/30 border-red-500 text-red-100";
              } else {
                buttonStyles = "bg-slate-800/50 border-slate-800 text-slate-500 opacity-50";
              }
            }

            return (
              <motion.button
                key={index}
                whileHover={!showFeedback ? { scale: 1.02, translateY: -2 } : {}}
                whileTap={!showFeedback ? { scale: 0.98 } : {}}
                onClick={() => handleAnswer(index)}
                disabled={showFeedback}
                className={`p-6 rounded-2xl border-2 text-lg font-bold transition-all duration-200 text-left relative overflow-hidden group ${buttonStyles}`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {!showFeedback && (
                    <div className="w-6 h-6 rounded-full border border-slate-600 flex items-center justify-center text-xs text-slate-500 group-hover:border-indigo-500 group-hover:text-indigo-400">
                      {index + 1}
                    </div>
                  )}
                  {showFeedback && isCorrect && <CheckCircle size={20} className="text-green-500" />}
                  {showFeedback && isSelected && !isCorrect && <XCircle size={20} className="text-red-500" />}
                </div>
                
                {/* Decoration */}
                {!showFeedback && (
                  <div className="absolute top-0 right-0 w-12 h-full bg-linear-to-r from-transparent to-white/5 skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Reward Hint */}
        <div className="mt-12 flex items-center gap-6">
            <div className="flex items-center gap-2 text-indigo-400 font-bold bg-indigo-500/10 px-4 py-2 rounded-xl border border-indigo-500/20">
                <span className="text-xl">✨</span>
                +30 XP
            </div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20">
                <span className="text-xl">🌱</span>
                +10 Garden Health
            </div>
        </div>
      </main>

      <style jsx>{`
        main {
          animation: fadeIn 0.8s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
