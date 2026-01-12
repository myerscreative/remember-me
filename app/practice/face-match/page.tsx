'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameHeader } from '@/components/game/GameHeader';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ResultsScreen } from '@/components/game/ResultsScreen';
import { useGameData } from '@/hooks/useGameData';
import { Loader2 } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  group?: string;
  // GameData fields
  company?: string | null;
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

function FaceMatchGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
    correct: Contact;
    choices: Contact[];
  }>>([]);

  const generateQuestions = useCallback(() => {
    if (loading || allContacts.length < 4) return; // Need at least 4 contacts

    const newQuestions: { correct: Contact; choices: Contact[] }[] = [];
    const usedContacts = new Set<string>();

    const filterType = searchParams.get('filter');
    const filterValue = searchParams.get('value');

    let availablePool = allContacts;
    
    // Apply filters
    if (filterType === 'group' && filterValue) {
        availablePool = allContacts.filter(c => c.group === filterValue);
        // Fallback if not enough contacts in group
        if (availablePool.length < 4) {
            console.warn('Not enough contacts in group, using all contacts');
            availablePool = allContacts;
        }
    } else if (filterType === 'recent') {
        availablePool = allContacts.slice(0, 10); // Take top 10 recent
    }

    const questionCount = Math.min(10, availablePool.length);
    if (questionCount === 0) return;

    for (let i = 0; i < questionCount; i++) {
        // Pick a correct contact that hasn't been used yet if possible
        const unusedInPool = availablePool.filter(c => !usedContacts.has(c.id));
        const pool = unusedInPool.length > 0 ? unusedInPool : availablePool;
        
        if (pool.length === 0) break;

        const correct = pool[Math.floor(Math.random() * pool.length)];
        usedContacts.add(correct.id);

        // Map GameContact to local Contact interface
        const correctMapped: Contact = {
             id: correct.id,
             name: correct.name,
             initials: correct.initials,
             avatar: correct.photo_url || undefined,
             group: correct.group
        };

        const otherContacts = allContacts.filter(c => c.id !== correct.id);
        const shuffled = [...otherContacts].sort(() => Math.random() - 0.5);
        const choices = [correctMapped, ...shuffled.slice(0, 3).map(c => ({
             id: c.id,
             name: c.name,
             initials: c.initials,
             avatar: c.photo_url || undefined,
             group: c.group
        }))].sort(() => Math.random() - 0.5);

        newQuestions.push({ correct: correctMapped, choices });
    }

    setQuestions(newQuestions);
    setGameState(prev => ({
        ...prev,
        totalQuestions: newQuestions.length
    }));

  }, [searchParams, allContacts, loading]); 

  // Generate questions when contacts load
  useEffect(() => {
    if (!loading && allContacts.length > 0) {
        generateQuestions();
    }
  }, [loading, allContacts, generateQuestions]);

  if (loading) {
      return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      );
  }

  if (allContacts.length < 4) {
      return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
                <div className="text-4xl mb-4">👥</div>
                <h2 className="text-xl font-bold mb-2">Not enough contacts</h2>
                <p className="text-gray-600 mb-6">You need at least 4 contacts to play Face Match. Go add some friends!</p>
                <button onClick={() => router.push('/')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Go to Dashboard</button>
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
          // Time's up - move to next question
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

    // Move to next question after 1.5 seconds
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
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <p className="text-lg text-slate-600">Loading game...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (gameState.gameStatus === 'complete') {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <ResultsScreen
            score={gameState.score}
            correctAnswers={gameState.correctAnswers}
            totalQuestions={gameState.totalQuestions}
            streak={gameState.streak}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={() => router.push('/practice')}
            primaryColor="indigo"
        />
      </div>
    );
  }

  // Game screen
  const currentQuestion = questions[gameState.currentQuestion];

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 p-4">
      <GameHeader
          score={gameState.score}
          streak={gameState.streak}
          timeLeft={gameState.timeLeft}
          onBack={() => router.push('/practice')}
      />

      <ProgressBar
          current={gameState.currentQuestion + 1}
          total={gameState.totalQuestions}
          colorFrom="from-indigo-500"
          colorTo="to-purple-500"
      />

      {/* Game Content */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Question Prompt */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Who is this?</h2>
            {searchParams.get('filter') === 'group' && (
                <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                    Group: {searchParams.get('value')}
                </span>
            )}
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-8">
            <div className="w-32 h-32 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-5xl font-bold shadow-2xl">
              {currentQuestion.correct.initials}
            </div>
          </div>

          {/* Choices */}
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
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:scale-105'
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

export default function FaceMatchGame() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎮</div>
          <p className="text-lg text-slate-600">Loading game...</p>
        </div>
      </div>
    }>
      <FaceMatchGameContent />
    </Suspense>
  );
}
