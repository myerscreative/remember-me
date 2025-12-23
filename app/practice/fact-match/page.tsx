'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { GameHeader } from '@/components/game/GameHeader';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ResultsScreen } from '@/components/game/ResultsScreen';

interface Contact {
  id: string;
  name: string;
  initials: string;
  company?: string;
  location?: string;
  family?: {
      spouse?: string;
      children?: Array<{ name: string; age: number }>;
  };
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
  
  // Mock contact data
  const allContacts: Contact[] = [
    { id: '1', name: 'Sarah Chen', initials: 'SC', company: 'TechCorp', location: 'San Francisco' },
    { id: '2', name: 'Mike Johnson', initials: 'MJ', company: 'Startup Inc', location: 'Austin' },
    { id: '3', name: 'Tom Hall', initials: 'TH', company: 'Finance Co', location: 'New York' },
    { id: '4', name: 'Jennifer Martinez', initials: 'JM', company: 'Design Studio', location: 'Portland' },
    { id: '5', name: 'David Kim', initials: 'DK', company: 'TechCorp', location: 'San Francisco' },
    { id: '6', name: 'Emily Brown', initials: 'EB', company: 'Education', location: 'Chicago' },
    { id: '7', name: 'James Wilson', initials: 'JW', company: 'Healthcare', location: 'Boston' },
    { id: '8', name: 'Lisa Anderson', initials: 'LA', company: 'Law Firm', location: 'DC' },
  ];

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
    const newQuestions = [];
    const usedIndices = new Set<string>();

    const questionTypes = [
        (c: Contact) => `Who works at ${c.company}?`,
        (c: Contact) => `Who lives in ${c.location}?`,
    ];

    for (let i = 0; i < 10; i++) {
        // Pick random contact
        const contact = allContacts[Math.floor(Math.random() * allContacts.length)];
        // Pick random question type
        const typeIndex = Math.floor(Math.random() * questionTypes.length);
        
        const questionKey = `${contact.id}-${typeIndex}`;
        
        // Simple duplicate avoidance (not strict for mock)
        if(usedIndices.has(questionKey)) {
             // quick retry
             i--; 
             continue; 
        }
        usedIndices.add(questionKey);

        const prompt = questionTypes[typeIndex](contact);

        const otherContacts = allContacts.filter(c => c.id !== contact.id);
        const shuffled = [...otherContacts].sort(() => Math.random() - 0.5);
        const choices = [contact, ...shuffled.slice(0, 3)].sort(() => Math.random() - 0.5);

        newQuestions.push({ prompt, correct: contact, choices });
    }

    setQuestions(newQuestions);
  }, []); // Dependencies: allContacts is static

  // Generate questions on mount
  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

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
