'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GameHeader } from '@/components/game/GameHeader';
import { ProgressBar } from '@/components/game/ProgressBar';
import { ResultsScreen } from '@/components/game/ResultsScreen';

interface Contact {
  id: string;
  name: string;
  initials: string;
  interests: string[];
  group?: string;
}

interface Question {
  interest: string;
  correctContactIds: string[];
}

// Mock data - replace with real Supabase data
const allContacts: Contact[] = [
  { id: '1', name: 'Sarah Chen', initials: 'SC', interests: ['Fishing', 'AI/ML', 'Guitar', 'Coffee'], group: 'work' },
  { id: '2', name: 'Mike Johnson', initials: 'MJ', interests: ['Fishing', 'Guitar', 'Golf'], group: 'work' },
  { id: '3', name: 'Tom Hall', initials: 'TH', interests: ['Golf', 'Wine', 'Travel'], group: 'family' },
  { id: '4', name: 'Jennifer Martinez', initials: 'JM', interests: ['Yoga', 'Travel', 'Reading'], group: 'work' },
  { id: '5', name: 'David Kim', initials: 'DK', interests: ['AI/ML', 'Coffee', 'Gaming'], group: 'tech-conf' },
  { id: '6', name: 'Emily Brown', initials: 'EB', interests: ['Yoga', 'Cooking', 'Photography'], group: 'family' },
  { id: '7', name: 'James Wilson', initials: 'JW', interests: ['Golf', 'Coffee', 'Tech'], group: 'tech-conf' },
  { id: '8', name: 'Lisa Anderson', initials: 'LA', interests: ['Reading', 'Wine', 'Tech'], group: 'work' },
];

function InterestMatchGameContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [showFeedback, setShowFeedback] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45);
  const [gameStatus, setGameStatus] = useState<'playing' | 'complete'>('playing');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(allContacts);

  const totalQuestions = 8;

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
    
    setFilteredContacts(pool);

    const availableInterests = Array.from(new Set(pool.flatMap(c => c.interests)));
    const usedInterests = new Set<string>();
    const newQuestions: Question[] = [];

    // Adjust total questions if not enough interests
    const count = Math.min(totalQuestions, availableInterests.length);

    for (let i = 0; i < count; i++) {
        // Filter out used interests
        const candidates = availableInterests.filter(int => !usedInterests.has(int));
        if (candidates.length === 0) break;

        const interest = candidates[Math.floor(Math.random() * candidates.length)];
        usedInterests.add(interest);

        const correctContactIds = pool
            .filter(c => c.interests.includes(interest))
            .map(c => c.id);
        
        // Ensure at least one correct answer
        if(correctContactIds.length > 0) {
            newQuestions.push({ interest, correctContactIds });
        } else {
            i--; // try again
        }
    }

    setQuestions(newQuestions);
  }, [searchParams]); 

  // Generate questions on mount
  useEffect(() => {
    generateQuestions();
  }, [generateQuestions]);

  const handleSubmit = useCallback(() => {
    if (showFeedback || questions.length === 0) return;

    const question = questions[currentQuestion];
    if (!question) return;

    const correctSet = new Set(question.correctContactIds);
    const isCorrect = 
      selectedContacts.size === correctSet.size &&
      [...selectedContacts].every(id => correctSet.has(id));

    if (isCorrect) {
      setScore(prev => prev + 150);
      setCorrectAnswers(prev => prev + 1);
    }

    setShowFeedback(true);

    setTimeout(() => {
      if (currentQuestion + 1 >= questions.length) { // Use actual questions length
        setGameStatus('complete');
      } else {
        setCurrentQuestion(prev => prev + 1);
        setSelectedContacts(new Set());
        setShowFeedback(false);
        setTimeLeft(45);
      }
    }, 2000);
  }, [currentQuestion, questions, selectedContacts, showFeedback]);

  // Timer
  useEffect(() => {
    if (gameStatus !== 'playing' || showFeedback || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStatus, showFeedback, questions.length]);

  // Timeout handler
  useEffect(() => {
      if (timeLeft === 0 && gameStatus === 'playing' && !showFeedback && questions.length > 0) {
          handleSubmit();
      }
  }, [timeLeft, handleSubmit, gameStatus, showFeedback, questions.length]);


  function toggleContact(contactId: string) {
    if (showFeedback) return;

    setSelectedContacts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(contactId)) {
        newSet.delete(contactId);
      } else {
        newSet.add(contactId);
      }
      return newSet;
    });
  }

  function handlePlayAgain() {
    setCurrentQuestion(0);
    setScore(0);
    setCorrectAnswers(0);
    setSelectedContacts(new Set());
    setShowFeedback(false);
    setTimeLeft(45);
    setGameStatus('playing');
    
    generateQuestions();
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎣</div>
          <p className="text-lg text-slate-600">Loading game...</p>
        </div>
      </div>
    );
  }

  // Results screen
  if (gameStatus === 'complete') {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <ResultsScreen
            score={score}
            correctAnswers={correctAnswers}
            totalQuestions={questions.length} // Use actual length
            streak={0} // Adding basic streak support if needed, or 0
            onPlayAgain={handlePlayAgain}
            onBackToMenu={() => router.push('/practice')}
            primaryColor="green"
        />
      </div>
    );
  }

  // Game screen
  const question = questions[currentQuestion];
  const correctSet = new Set(question.correctContactIds);

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 p-4">
      <GameHeader
          score={score}
          streak={0}
          timeLeft={timeLeft}
          onBack={() => router.push('/practice')}
      />
      
      <ProgressBar
          current={currentQuestion + 1}
          total={questions.length}
          colorFrom="from-green-500"
          colorTo="to-emerald-500"
      />

      {/* Game Content */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-3xl shadow-xl p-8">
            {/* Question Prompt */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Who loves <span className="text-green-600">{question.interest}</span>?
            </h2>
            <div className="inline-block px-4 py-2 bg-amber-50 border-2 border-amber-200 rounded-lg">
              <p className="text-sm text-amber-700">
                💡 Hint: <span className="font-semibold">{question.correctContactIds.length}</span> {question.correctContactIds.length === 1 ? 'person' : 'people'}
              </p>
            </div>
          </div>

          {/* Contact Grid */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {filteredContacts.map(contact => {
              const isSelected = selectedContacts.has(contact.id);
              const isCorrect = correctSet.has(contact.id);
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={contact.id}
                  onClick={() => toggleContact(contact.id)}
                  disabled={showFeedback}
                  className={`p-6 rounded-2xl border-2 transition-all transform ${
                    showCorrect
                      ? 'bg-green-100 border-green-500 scale-105'
                      : showIncorrect
                      ? 'bg-red-100 border-red-500 animate-shake'
                      : isSelected
                      ? 'bg-green-600 text-white border-green-600 scale-105'
                      : 'bg-slate-50 border-slate-200 hover:border-green-400 hover:scale-105'
                  } ${showFeedback ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <div className={`w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold ${
                    isSelected && !showFeedback ? 'bg-green-500 text-white' : 'bg-linear-to-br from-green-500 to-emerald-500 text-white'
                  }`}>
                    {contact.initials}
                  </div>
                  <p className={`font-semibold text-center ${isSelected && !showFeedback ? 'text-white' : 'text-slate-900'}`}>
                    {contact.name}
                  </p>
                  {showCorrect && (
                    <div className="text-center mt-2 text-green-600 text-2xl">✓</div>
                  )}
                  {showIncorrect && (
                    <div className="text-center mt-2 text-red-600 text-2xl">✗</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Submit Button */}
          {!showFeedback && (
            <button
              onClick={handleSubmit}
              disabled={selectedContacts.size === 0}
              className="w-full py-4 bg-linear-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Submit Answer
            </button>
          )}

          {showFeedback && (
            <div className={`p-4 rounded-xl text-center font-semibold ${
              selectedContacts.size === correctSet.size && [...selectedContacts].every(id => correctSet.has(id))
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {selectedContacts.size === correctSet.size && [...selectedContacts].every(id => correctSet.has(id))
                ? '✅ Correct! +150 points'
                : `❌ Incorrect. The correct ${question.correctContactIds.length === 1 ? 'answer is' : 'answers are'}: ${allContacts.filter(c => correctSet.has(c.id)).map(c => c.name).join(', ')}`
              }
            </div>
          )}
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

export default function InterestMatchGame() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🎣</div>
          <p className="text-lg text-slate-600">Loading game...</p>
        </div>
      </div>
    }>
      <InterestMatchGameContent />
    </Suspense>
  );
}
