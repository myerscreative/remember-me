'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GameHeader } from '@/components/game/GameHeader';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ResultsScreen } from '@/components/game/ResultsScreen';

interface Contact {
  id: string;
  name: string;
  initials: string;
  company?: string;
  role?: string;
}

interface Event {
    id: string;
    title: string;
    date: Date;
    attendees: Contact[];
}

interface GameState {
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
  streak: number;
  gameStatus: 'playing' | 'complete';
  selectedAnswer: number | null;
  showFeedback: boolean;
}

// Mock event data - would normally fetch from /api/calendar/events
const mockEvent: Event = {
  id: 'evt-1',
  title: 'Quarterly Business Review',
  date: new Date(new Date().setDate(new Date().getDate() + 2)), // 2 days from now
  attendees: [
    { id: '1', name: 'Sarah Chen', initials: 'SC', company: 'TechCorp', role: 'CTO' },
    { id: '2', name: 'Mike Johnson', initials: 'MJ', company: 'TechCorp', role: 'VP Engineering' },
    { id: '3', name: 'James Wilson', initials: 'JW', company: 'TechCorp', role: 'Product Lead' },
    { id: '4', name: 'Lisa Anderson', initials: 'LA', company: 'Legal', role: 'General Counsel' },
  ]
};

// Pure function to generate questions - can be used for initial state and reset
function generateQuestions(): Array<{
  prompt: string;
  correctAnswer: string;
  choices: string[];
  contact: Contact;
}> {
  const newQuestions: Array<{
    prompt: string;
    correctAnswer: string;
    choices: string[];
    contact: Contact;
  }> = [];
  const attendees = mockEvent.attendees;

  for (let i = 0; i < 15; i++) {
    const contact = attendees[Math.floor(Math.random() * attendees.length)];
    const otherAttendees = attendees.filter(a => a.id !== contact.id);

    let prompt = '';
    let correctAnswer = '';
    let choices: string[] = [];

    const type = Math.random();

    if (type < 0.4) {
      // Face match style
      prompt = `Which attendee is ${contact.role}?`;
      correctAnswer = contact.name;
      choices = [contact.name, ...otherAttendees.map(a => a.name)].sort(() => Math.random() - 0.5);
    } else if (type < 0.7) {
      // Role match
      prompt = `What is ${contact.name}'s role?`;
      correctAnswer = contact.role!;
      choices = [contact.role!, ...otherAttendees.map(a => a.role!)].sort(() => Math.random() - 0.5);
    } else {
      // Initials match
      prompt = `Which initials belong to ${contact.name}?`;
      correctAnswer = contact.initials;
      choices = [contact.initials, ...otherAttendees.map(a => a.initials)].sort(() => Math.random() - 0.5);
    }

    newQuestions.push({ prompt, correctAnswer, choices, contact });
  }

  return newQuestions;
}

export default function EventPrepGame() {
  const router = useRouter();

  const [gameState, setGameState] = useState<GameState>({
    currentQuestion: 0,
    totalQuestions: 15,
    score: 0,
    correctAnswers: 0,
    streak: 0,
    gameStatus: 'playing',
    selectedAnswer: null,
    showFeedback: false,
  });

  // Use lazy initialization to generate questions on first render
  const [questions, setQuestions] = useState(() => generateQuestions());

  function handleAnswer(selectedIndex: number) {
    if (gameState.showFeedback) return;

    const currentQuestion = questions[gameState.currentQuestion];
    const selectedText = currentQuestion.choices[selectedIndex];
    const isCorrect = selectedText === currentQuestion.correctAnswer;

    // Base score lower for study mode, but maintaining streak is encouraged
    const basePoints = 75; 
    const streakBonus = gameState.streak * 5;
    const pointsEarned = isCorrect ? basePoints + streakBonus : 0;

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
        selectedAnswer: null,
        showFeedback: false,
        gameStatus: prev.currentQuestion + 1 >= prev.totalQuestions ? 'complete' : 'playing',
      }));
    }, 1200);
  }

  function handlePlayAgain() {
    setGameState({
      currentQuestion: 0,
      totalQuestions: 15,
      score: 0,
      correctAnswers: 0,
      streak: 0,
      gameStatus: 'playing',
      selectedAnswer: null,
      showFeedback: false,
    });
    setQuestions(generateQuestions());
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📅</div>
          <p className="text-lg text-slate-600">Loading exam...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (gameState.gameStatus === 'complete') {
    return (
      <div className="min-h-screen bg-linear-to-br from-indigo-50 to-blue-50 flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-linear-to-br from-indigo-50 to-blue-50 p-4">
      <GameHeader
          score={gameState.score}
          streak={gameState.streak}
          onBack={() => router.push('/practice')}
          title="Event Prep"
          icon="📅"
      />
      
      {/* Event Banner */}
      <div className="max-w-2xl mx-auto mb-4 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm flex items-center justify-between">
          <div>
              <h3 className="font-bold text-slate-900">{mockEvent.title}</h3>
              <p className="text-sm text-slate-500">{mockEvent.date.toLocaleDateString()} • {mockEvent.attendees.length} Attendees</p>
          </div>
          <div className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
              Study Mode
          </div>
      </div>

      <ProgressBar
          current={gameState.currentQuestion + 1}
          total={gameState.totalQuestions}
          colorFrom="from-indigo-500"
          colorTo="to-blue-500"
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
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:scale-105'
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
