interface ResultsScreenProps {
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  streak?: number;
  timeSpent?: number; // seconds
  onPlayAgain: () => void;
  onBackToMenu: () => void;
  primaryColor?: string; // e.g., 'indigo', 'green', 'red'
}

export function ResultsScreen({
  score,
  correctAnswers,
  totalQuestions,
  streak,
  timeSpent,
  onPlayAgain,
  onBackToMenu,
  primaryColor = 'indigo'
}: ResultsScreenProps) {
  const accuracy = Math.round((correctAnswers / totalQuestions) * 100);

  // Map color names to classes safely
  const colorMap: Record<string, string> = {
      indigo: 'text-indigo-600 bg-indigo-600 hover:bg-indigo-700',
      green: 'text-green-600 bg-green-600 hover:bg-green-700',
      red: 'text-red-600 bg-red-600 hover:bg-red-700',
      emerald: 'text-emerald-600 bg-emerald-600 hover:bg-emerald-700',
      amber: 'text-amber-600 bg-amber-600 hover:bg-amber-700',
      pink: 'text-pink-600 bg-pink-600 hover:bg-pink-700',
      violet: 'text-violet-600 bg-violet-600 hover:bg-violet-700',
      purple: 'text-purple-600 bg-purple-600 hover:bg-purple-700',
      orange: 'text-orange-600 bg-orange-600 hover:bg-orange-700',
      rose: 'text-rose-600 bg-rose-600 hover:bg-rose-700',
      teal: 'text-teal-600 bg-teal-600 hover:bg-teal-700',
  };

  const textColorClass = colorMap[primaryColor]?.split(' ')[0] || 'text-indigo-600';
  const btnBgClass = colorMap[primaryColor]?.split(' ').slice(1).join(' ') || 'bg-indigo-600 hover:bg-indigo-700';

  return (
    <div className="max-w-md w-full bg-surface rounded-3xl shadow-2xl p-8 mx-auto mt-10 animate-in fade-in zoom-in duration-300">
      <div className="text-center">
        <div className="text-8xl mb-6">
          {accuracy >= 80 ? '🏆' : accuracy >= 60 ? '⭐' : '💪'}
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-2">
          {accuracy >= 80 ? 'Excellent!' : accuracy >= 60 ? 'Good Job!' : 'Keep Practicing!'}
        </h2>
        <div className={`text-6xl font-bold mb-8 ${textColorClass}`}>
          {score} pts
        </div>

        <div className="bg-canvas rounded-2xl p-6 mb-8 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-text-tertiary">Correct Answers</span>
            <span className="font-semibold text-text-primary">
              {correctAnswers}/{totalQuestions}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-tertiary">Accuracy</span>
            <span className="font-semibold text-text-primary">{accuracy}%</span>
          </div>
          {streak !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Best Streak</span>
              <span className="font-semibold text-text-primary">🔥 {streak}</span>
            </div>
          )}
           {timeSpent !== undefined && (
            <div className="flex items-center justify-between">
              <span className="text-text-tertiary">Time Spent</span>
              <span className="font-semibold text-text-primary">{timeSpent}s</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onPlayAgain}
            className={`w-full py-4 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all ${btnBgClass}`}
          >
            Play Again
          </button>
          <button
            onClick={onBackToMenu}
            className="w-full py-4 bg-subtle text-text-tertiary font-semibold rounded-xl hover:bg-border-default transition-colors"
          >
            Back to Game Center
          </button>
        </div>
      </div>
    </div>
  );
}
