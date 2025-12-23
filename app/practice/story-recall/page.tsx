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
  memory: {
      whereMet?: string;
      whenMet?: string;
      topics?: string[];
      connectionReason?: string;
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

export default function StoryRecallGame() {
  const router = useRouter();
  
  // Mock contact data
  const allContacts: Contact[] = [
    { id: '1', name: 'Sarah Chen', initials: 'SC', memory: { whereMet: 'Tech Conference', connectionReason: 'Shared interest in AI', topics: ['Neural Networks', 'Hiking'] } },
    { id: '2', name: 'Mike Johnson', initials: 'MJ', memory: { whereMet: 'Coffee Shop', connectionReason: 'Neighbor', topics: ['Local classic cars', 'Espresso'] } },
    { id: '3', name: 'Tom Hall', initials: 'TH', memory: { whereMet: 'Golf Club', connectionReason: 'Business Partner', topics: ['Market Trends', 'Swing technique'] } },
    { id: '4', name: 'Jennifer Martinez', initials: 'JM', memory: { whereMet: 'Yoga Class', connectionReason: 'Instructor', topics: ['Mindfulness', 'Travel'] } },
    { id: '5', name: 'David Kim', initials: 'DK', memory: { whereMet: 'Alumni Event', connectionReason: 'University Friend', topics: ['Old professors', 'Gaming'] } },
    { id: '6', name: 'Emily Brown', initials: 'EB', memory: { whereMet: 'Book Club', connectionReason: 'Member', topics: ['Historical Fiction', 'Recipes'] } },
  ];

  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    totalQuestions: 8,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    timeLeft: 45, // Slightly longer for reading
    gameStatus: 'playing',
    selectedAnswer: null,
    showFeedback: false,
  });

  const [questions, setQuestions] = useState<Array<{
    prompt: string;
    correctAnswer: string;
    choices: string[];
    contact: Contact;
  }>>([]);

  const generateQuestions = useCallback(() => {
    const newQuestions: { prompt: string; correctAnswer: string; choices: string[]; contact: Contact }[] = [];
    
    // Helper to pick random wrong answers from other contacts or general pool
    const getRandomWrongAnswers = (type: 'where' | 'topics' | 'reason', corrextText: string, count: number) => {
       const wrongPool = {
           where: ['Gym', 'Library', 'Airport', 'Party', 'Work', 'Park', 'Restaurant'],
           topics: ['Politics', 'Weather', 'Sports', 'Music', 'Movies', 'Art'],
           reason: ['Client', 'Vendor', 'Childhood Friend', 'Cousin', 'Mentor', 'Mentee']
       };
       
       // Try to pull from other contacts first for realism
       const otherContactsPool = allContacts
            .filter(c => {
                if(type === 'where') return c.memory.whereMet && c.memory.whereMet !== corrextText;
                if(type === 'reason') return c.memory.connectionReason && c.memory.connectionReason !== corrextText;
                if(type === 'topics') return c.memory.topics && !c.memory.topics.includes(corrextText);
                return false;
            })
            .map(c => {
                 if(type === 'where') return c.memory.whereMet!;
                 if(type === 'reason') return c.memory.connectionReason!;
                 // Pick one random topic
                 return c.memory.topics![Math.floor(Math.random() * c.memory.topics!.length)];
            });

       const combinedPool = [...new Set([...otherContactsPool, ...wrongPool[type]])];
       const shuffled = combinedPool.filter(a => a !== corrextText).sort(() => Math.random() - 0.5);
       return shuffled.slice(0, count);
    };

    for (let i = 0; i < 8; i++) {
        // Pick random contact
        const contact = allContacts[Math.floor(Math.random() * allContacts.length)];
        
        // Randomize question type
        const typeRoll = Math.random();
        let prompt = '';
        let correctAnswer = '';
        let wrongAnswers: string[] = [];

        if (typeRoll < 0.4 && contact.memory.whereMet) {
            prompt = `Where did you meet ${contact.name}?`;
            correctAnswer = contact.memory.whereMet;
            wrongAnswers = getRandomWrongAnswers('where', correctAnswer, 3);
        } else if (typeRoll < 0.7 && contact.memory.connectionReason) {
             prompt = `Why did you connect with ${contact.name}?`;
             correctAnswer = contact.memory.connectionReason;
             wrongAnswers = getRandomWrongAnswers('reason', correctAnswer, 3);
        } else if (contact.memory.topics && contact.memory.topics.length > 0) {
             prompt = `Which topic did you discuss with ${contact.name}?`;
             correctAnswer = contact.memory.topics[0]; // Simplified for now
             wrongAnswers = getRandomWrongAnswers('topics', correctAnswer, 3);
        } else {
             // Fallback
             i--; 
             continue; 
        }

        const choices = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        newQuestions.push({ prompt, correctAnswer, choices, contact });
    }

    setQuestions(newQuestions);
  }, []); // Dependencies

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
            timeLeft: 45,
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
    const selectedText = currentQuestion.choices[selectedIndex];
    const isCorrect = selectedText === currentQuestion.correctAnswer;

    const basePoints = 125; // Slightly higher for story recall
    const speedBonus = gameState.timeLeft > 35 ? 25 : 0;
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
        timeLeft: 45,
        selectedAnswer: null,
        showFeedback: false,
        gameStatus: prev.currentQuestion + 1 >= prev.totalQuestions ? 'complete' : 'playing',
      }));
    }, 2000); // Longer pause to read
  }

  function handlePlayAgain() {
    setGameState({
      currentQuestion: 0,
      totalQuestions: 8,
      score: 0,
      correctAnswers: 0,
      streak: 0,
      timeLeft: 45,
      gameStatus: 'playing',
      selectedAnswer: null,
      showFeedback: false,
    });
    generateQuestions();
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📖</div>
          <p className="text-lg text-slate-600">Loading memories...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (gameState.gameStatus === 'complete') {
    return (
      <div className="min-h-screen bg-linear-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <ResultsScreen
            score={gameState.score}
            correctAnswers={gameState.correctAnswers}
            totalQuestions={gameState.totalQuestions}
            streak={gameState.streak}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={() => router.push('/practice')}
            primaryColor="amber"
        />
      </div>
    );
  }

  // Game screen
  const currentQuestion = questions[gameState.currentQuestion];

  return (
    <div className="min-h-screen bg-linear-to-br from-amber-50 to-orange-50 p-4">
      <GameHeader
          score={gameState.score}
          streak={gameState.streak}
          timeLeft={gameState.timeLeft}
          onBack={() => router.push('/practice')}
          title="Story Recall"
          icon="📖"
      />

      <ProgressBar
          current={gameState.currentQuestion + 1}
          total={gameState.totalQuestions}
          colorFrom="from-amber-500"
          colorTo="to-orange-500"
      />

      {/* Game Content */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Context Card - show who checking memory for */}
           <div className="flex items-center justify-center gap-4 mb-8 bg-amber-50 p-4 rounded-xl border border-amber-100">
               <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold">
                   {currentQuestion.contact.initials}
               </div>
               <div className="text-lg font-semibold text-amber-900">
                   {currentQuestion.contact.name}
               </div>
           </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">{currentQuestion.prompt}</h2>
          </div>

          <div className="space-y-3">
            {currentQuestion.choices.map((choice, index) => {
              const isSelected = gameState.selectedAnswer === index;
              const isCorrect = choice === currentQuestion.correctAnswer;
              const showCorrect = gameState.showFeedback && isCorrect;
              const showIncorrect = gameState.showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={gameState.showFeedback}
                  className={`w-full p-4 rounded-xl font-semibold text-lg text-left transition-all transform ${
                    showCorrect
                      ? 'bg-green-100 border-2 border-green-500 scale-105'
                      : showIncorrect
                      ? 'bg-red-100 border-2 border-red-500 animate-shake'
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-amber-400 hover:bg-amber-50 hover:scale-105'
                  } ${gameState.showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {choice}
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
