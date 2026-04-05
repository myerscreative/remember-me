'use client';

import { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { generateWebRecallQuestions, WebRecallQuestion } from '@/app/actions/game-web-recall';
import { useGameStats } from '@/hooks/useGameStats';

const WebRecallGame = dynamic(
  () => import('@/components/practice/WebRecallGame').then((m) => ({ default: m.WebRecallGame })),
  {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[320px] text-text-tertiary">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
});

function WebRecallGamePageContent() {
  const router = useRouter();
  const { recordGame } = useGameStats();
  const [questions, setQuestions] = useState<WebRecallQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function initGame() {
      try {
        const result = await generateWebRecallQuestions(10);
        if (result.success) {
          if (result.questions.length === 0) {
            setError("You need at least one relationship between contacts to play Web Recall.");
          } else {
            setQuestions(result.questions);
          }
        } else {
          setError(result.error || "Failed to load questions");
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    initGame();
  }, []);

  const handleGameComplete = (score: number) => {
    recordGame('webRecall', score);
    // Any other completion logic (like garden health) would go here or in a centralized service
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="bg-elevated p-8 rounded-3xl shadow-xl text-center max-w-md border border-border-default">
          <div className="text-5xl mb-6">🕸️</div>
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Not enough connections</h2>
          <p className="text-text-tertiary mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => router.push('/practice')} 
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/20"
          >
            Back to Game Center
          </button>
        </div>
      </div>
    );
  }

  return <WebRecallGame questions={questions} onComplete={handleGameComplete} />;
}

export default function WebRecallPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    }>
      <WebRecallGamePageContent />
    </Suspense>
  );
}
