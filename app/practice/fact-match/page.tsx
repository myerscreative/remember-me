'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GameHeader } from '@/components/game/GameHeader';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { useGameData } from '@/hooks/useGameData';
import { Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  initials: string;
  company?: string;
  location?: string;
}

interface GameState {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
  streak: number;
  timeLeft: number;
  gameStatus: 'playing' | 'complete';
  selectedAnswer: number | null;
  showFeedback: boolean;
}

export default function FactMatchGame() {
  const router = useRouter();
  const { contacts: allContacts, loading } = useGameData();

  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    totalQuestions: 10,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    timeLeft: 30,
    gameStatus: 'playing',
    selectedAnswer: null,
    showFeedback: false,
  });

  const [questions, setQuestions] = useState<Array<{
    prompt: string;
    correct: Contact;
    choices: Contact[];
  }>>([]);

  const generateQuestions = useCallback(() => {
    if (loading || allContacts.length < 4) return;

    const newQuestions: { prompt: string; correct: Contact; choices: Contact[] }[] = [];
    const usedIndices = new Set<string>();

    const questionTypes = [
        (c: Contact) => c.company ? `Who works at ${c.company}?` : null,
        // (c: Contact) => c.location ? `Who lives in ${c.location}?` : null, // Location removed from types, disabling
    ];

    const MAX_ATTEMPTS = 50;
    let attempts = 0;

    while (newQuestions.length < 10 && attempts < MAX_ATTEMPTS) {
        attempts++;
        
        // Pick random contact
        const contact = allContacts[Math.floor(Math.random() * allContacts.length)];
        
        // Map to local Contact interface
        const contactMapped: Contact = {
             id: contact.id,
             name: contact.name,
             initials: contact.initials,
             company: contact.company || undefined,
             location: contact.location || undefined
        };

        // Pick random question type
        const typeIndex = Math.floor(Math.random() * questionTypes.length);
        const promptGenerator = questionTypes[typeIndex];
        const prompt = promptGenerator(contactMapped);

        if (!prompt) continue; // Skip if data missing for this question type
        
        const questionKey = `${contact.id}-${typeIndex}`;
        
        if(usedIndices.has(questionKey)) continue;
        
        usedIndices.add(questionKey);

        const otherContacts = allContacts.filter(c => c.id !== contact.id);
        const shuffled = [...otherContacts].sort(() => Math.random() - 0.5);
        const choices = [contactMapped, ...shuffled.slice(0, 3).map(c => ({
             id: c.id,
             name: c.name,
             initials: c.initials,
             company: c.company || undefined,
             location: c.location || undefined
        }))].sort(() => Math.random() - 0.5);

        newQuestions.push({ prompt, correct: contactMapped, choices });
    }

    setQuestions(newQuestions);
    setGameState(prev => ({
        ...prev,
        totalQuestions: newQuestions.length || 1 // Avoid 0 if failed
    }));
  }, [allContacts, loading]);

  // Generate questions on mount
  useEffect(() => {
    if (!loading && allContacts.length > 0) {
        generateQuestions();
    }
  }, [loading, allContacts, generateQuestions]);
  
  if (loading) {
      return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      );
  }

  if (allContacts.length < 4 || questions.length === 0) {
       return (
        <div className="min-h-screen bg-linear-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                <div className="text-4xl mb-4">🧩</div>
                <h2 className="text-xl font-bold mb-2">Not enough data</h2>
                <p className="text-gray-600 mb-6">We need more contacts with Company info to play Fact Match!</p>
                <button onClick={() => router.push('/')} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Go to Dashboard</button>
            </div>
        </div>
      );
  }

  // Timer countdown
  useEffect(() => {
    if (gameState.gameStatus !== 'playing' || gameState.showFeedback) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          return {
            ...prev,
            timeLeft: 30,
            currentQuestion: prev.currentQuestion + 1,
            streak: 0,
            gameStatus: prev.currentQuestion + 1 >= prev.totalQuestions ? 'complete' : 'playing',
          };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStatus, gameState.showFeedback]);

  function handleAnswer(selectedIndex: number) {
    if (gameState.showFeedback) return;

    const currentQuestion = questions[gameState.currentQuestion];
    const selectedContact = currentQuestion.choices[selectedIndex];
    const isCorrect = selectedContact.id === currentQuestion.correct.id;

    const basePoints = 100;
    const speedBonus = gameState.timeLeft > 25 ? 25 : 0;
    const streakBonus = gameState.streak * 10;
    const pointsEarned = isCorrect ? basePoints + speedBonus + streakBonus : 0;

    setGameState(prev => ({
      ...prev,
      selectedAnswer: selectedIndex,
      showFeedback: true,
      score: prev.score + pointsEarned,
      correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
      streak: isCorrect ? prev.streak + 1 : 0,
    }));

    setTimeout(() => {
      setGameState(prev => ({
        ...prev,
        currentQuestion: prev.currentQuestion + 1,
        timeLeft: 30,
        selectedAnswer: null,
        showFeedback: false,
        gameStatus: prev.currentQuestion + 1 >= prev.totalQuestions ? 'complete' : 'playing',
      }));
    }, 1500);
  }

  function handlePlayAgain() {
    setGameState({
      currentQuestion: 0,
      totalQuestions: 10,
      score: 0,
      correctAnswers: 0,
      streak: 0,
      timeLeft: 30,
      gameStatus: 'playing',
      selectedAnswer: null,
      showFeedback: false,
    });
    generateQuestions();
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🧩</div>
          <p className="text-lg text-slate-600">Loading game...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (gameState.gameStatus === 'complete') {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <ResultsScreen
            score={gameState.score}
            correctAnswers={gameState.correctAnswers}
            totalQuestions={gameState.totalQuestions}
            streak={gameState.streak}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={() => router.push('/practice')}
            primaryColor="blue"
        />
      </div>
    );
  }

  // Game screen
  const currentQuestion = questions[gameState.currentQuestion];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-cyan-50 p-4">
      <GameHeader
          score={gameState.score}
          streak={gameState.streak}
          timeLeft={gameState.timeLeft}
          onBack={() => router.push('/practice')}
      />

      <ProgressBar
          current={gameState.currentQuestion + 1}
          total={gameState.totalQuestions}
          colorFrom="from-blue-500"
          colorTo="to-cyan-500"
      />

      {/* Game Content */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentQuestion.prompt}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = gameState.selectedAnswer === index;
              const isCorrect = choice.id === currentQuestion.correct.id;
              const showCorrect = gameState.showFeedback && isCorrect;
              const showIncorrect = gameState.showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={choice.id}
                  onClick={() => handleAnswer(index)}
                  disabled={gameState.showFeedback}
                  className={`w-full p-4 rounded-xl font-semibold text-lg text-left transition-all transform ${
                    showCorrect
                      ? 'bg-green-100 border-2 border-green-500 scale-105'
                      : showIncorrect
                      ? 'bg-red-100 border-2 border-red-500 animate-shake'
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-105'
                  } ${gameState.showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span className="text-slate-500 mr-3">{String.fromCharCode(65 + index)})</span>
                  {choice.name}
                  {showCorrect && <span className="float-right text-green-600 text-2xl">✓</span>}
                  {showIncorrect && <span className="float-right text-red-600 text-2xl">✗</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.5s ease;
        }
      `}</style>
    </div>
  );
}
