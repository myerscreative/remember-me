'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameHeader } from '@/components/game/GameHeader';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ResultsScreen } from '@/components/game/ResultsScreen';

interface Contact {
  id: string;
  name: string;
  initials: string;
  company?: string;
  location?: string;
  interests: string[];
  family?: {
    spouse?: string;
    children?: Array<{ name: string; age: number }>;
  };
  group?: string;
}

interface Question {
  question: string;
  correctAnswer: string;
  acceptedAnswers: string[]; // Multiple valid answers
  contact: Contact;
}

// Mock data
const allContacts: Contact[] = [
  { 
    id: '1', 
    name: 'Sarah Chen', 
    initials: 'SC',
    company: 'AI Startup',
    location: 'Austin',
    interests: ['Fishing', 'AI/ML', 'Guitar'],
    family: { children: [{ name: 'Emma', age: 7 }] },
    group: 'work'
  },
  { 
    id: '2', 
    name: 'Mike Johnson', 
    initials: 'MJ',
    company: 'Tech Corp',
    location: 'San Francisco',
    interests: ['Fishing', 'Guitar', 'Golf'],
    group: 'work'
  },
  { 
    id: '3', 
    name: 'Tom Hall', 
    initials: 'TH',
    company: 'Venture Capital',
    location: 'New York',
    interests: ['Golf', 'Wine'],
    group: 'family'
  },
  {
    id: '4',
    name: 'David Kim',
    initials: 'DK',
    company: 'Dev Inc',
    location: 'Seattle',
    interests: ['Gaming', 'Coffee'],
    group: 'tech-conf'
  }
];

export default function QuickFireGame() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStatus, setGameStatus] = useState<'playing' | 'complete'>('playing');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);

  const totalQuestions = 15;

  const generateQuestions = useCallback(() => {
    const filterType = searchParams.get('filter');
    const filterValue = searchParams.get('value');

    let pool = allContacts;
    if (filterType === 'group' && filterValue) {
        pool = allContacts.filter(c => c.group === filterValue);
        if (pool.length < 2) pool = allContacts; // Fallback
    } else if (filterType === 'recent') {
        pool = allContacts.slice(0, 4);
    }

    const questionTemplates = [
      (c: Contact) => ({
        question: `What company does ${c.name} work for?`,
        correctAnswer: c.company || '',
        acceptedAnswers: [c.company?.toLowerCase() || ''],
        contact: c,
      }),
      (c: Contact) => ({
        question: `Where does ${c.name} live?`,
        correctAnswer: c.location || '',
        acceptedAnswers: [c.location?.toLowerCase() || ''],
        contact: c,
      }),
      (c: Contact) => ({
        question: `What are ${c.initials}'s initials for?`,
        correctAnswer: c.name,
        acceptedAnswers: [c.name.toLowerCase()],
        contact: c,
      }),
      (c: Contact) => c.interests.length > 0 ? ({
        question: `Name one interest of ${c.name}`,
        correctAnswer: c.interests[0],
        acceptedAnswers: c.interests.map(i => i.toLowerCase()),
        contact: c,
      }) : null,
      (c: Contact) => c.family?.children?.[0] ? ({
        question: `What is ${c.name}'s child's name?`,
        correctAnswer: c.family.children[0].name,
        acceptedAnswers: [c.family.children[0].name.toLowerCase()],
        contact: c,
      }) : null,
    ];

    const finalQuestions: Question[] = [];
    let attempts = 0;
    while(finalQuestions.length < totalQuestions && attempts < 100) {
        attempts++;
        const contact = pool[attempts % pool.length];
        const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
        const question = template(contact);
        if(question && question.correctAnswer) { // Basic validation
             finalQuestions.push(question);
        }
    }

    setQuestions(finalQuestions);
  }, [searchParams]); 

  // Generate questions on mount
  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  // Timer countdown
  useEffect(() => {
    if (gameStatus !== 'playing' || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameStatus('complete');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, questions.length]);

  // Auto-focus input
  useEffect(() => {
    if (gameStatus === 'playing' && !feedback) {
      inputRef.current?.focus();
    }
  }, [currentQuestion, feedback, gameStatus]);

  function normalizeAnswer(answer: string): string {
    return answer.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!userAnswer.trim() || feedback || questions.length === 0) return;

    const question = questions[currentQuestion];
    const normalized = normalizeAnswer(userAnswer);
    const isCorrect = question.acceptedAnswers.some(ans => 
      normalizeAnswer(ans) === normalized || normalized.includes(normalizeAnswer(ans))
    );

    if (isCorrect) {
      setScore(prev => prev + 100);
      setCorrectAnswers(prev => prev + 1);
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }

    setTimeout(() => {
      if (currentQuestion + 1 >= totalQuestions || timeLeft <= 0) {
        setGameStatus('complete');
      } else {
        setCurrentQuestion(prev => prev + 1);
        setUserAnswer('');
        setFeedback(null);
      }
    }, 800);
  }

  function handleSkip() {
    if (feedback) return;
    
    if (currentQuestion + 1 >= totalQuestions || timeLeft <= 0) {
      setGameStatus('complete');
    } else {
      setCurrentQuestion(prev => prev + 1);
      setUserAnswer('');
      setFeedback(null);
    }
  }

  function handlePlayAgain() {
    setCurrentQuestion(0);
    setScore(0);
    setCorrectAnswers(0);
    setTimeLeft(60);
    setGameStatus('playing');
    setUserAnswer('');
    setFeedback(null);

    generateQuestions();
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚡</div>
          <p className="text-lg text-slate-600">Loading game...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (gameStatus === 'complete') {
    return (
      <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <ResultsScreen
            score={score}
            correctAnswers={correctAnswers}
            totalQuestions={totalQuestions}
            timeSpent={Math.max(0, 60 - timeLeft)}
            onPlayAgain={handlePlayAgain}
            onBackToMenu={() => router.push('/practice')}
            primaryColor="red"
        />
      </div>
    );
  }

  // Game screen
  const question = questions[currentQuestion];

  return (
    <div className="min-h-screen bg-linear-to-br from-red-50 to-orange-50 p-4">
      <GameHeader
          score={score}
          timeLeft={timeLeft}
          onBack={() => router.push('/practice')}
      />
      
      <ProgressBar
          current={currentQuestion + 1}
          total={totalQuestions}
          colorFrom="from-red-500"
          colorTo="to-orange-500"
      />

      {/* Game Content */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block px-4 py-2 bg-red-100 rounded-lg mb-4">
              <span className="text-sm font-semibold text-red-600">⚡ QUICK FIRE</span>
            </div>
            {searchParams.get('filter') === 'group' && (
                <div className="mb-2">
                    <span className="inline-block bg-red-50 text-red-700 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        Group: {searchParams.get('value')}
                    </span>
                </div>
            )}
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              {question.question}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                disabled={!!feedback}
                placeholder="Type your answer..."
                className={`w-full px-6 py-4 text-lg border-2 rounded-xl focus:outline-none focus:ring-4 transition-all ${
                  feedback === 'correct'
                    ? 'bg-green-100 border-green-500 focus:ring-green-200'
                    : feedback === 'incorrect'
                    ? 'bg-red-100 border-red-500 focus:ring-red-200'
                    : 'border-slate-200 focus:border-red-400 focus:ring-red-100'
                }`}
                autoComplete="off"
              />
              {feedback && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-3xl">
                  {feedback === 'correct' ? '✓' : '✗'}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!userAnswer.trim() || !!feedback}
                className="flex-1 py-4 bg-linear-to-r from-red-600 to-orange-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Submit
              </button>
              <button
                type="button"
                onClick={handleSkip}
                disabled={!!feedback}
                className="px-6 py-4 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Skip
              </button>
            </div>
          </form>

          {feedback === 'incorrect' && (
            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
              <p className="text-sm text-red-700">
                <span className="font-semibold">Correct answer:</span> {question.correctAnswer}
              </p>
            </div>
          )}

          <div className="mt-6 text-center text-sm text-slate-500">
            Press <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300">Enter</kbd> to submit
          </div>
        </div>
      </div>
    </div>
  );
}
