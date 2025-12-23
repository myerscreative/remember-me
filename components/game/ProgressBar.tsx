interface ProgressBarProps {
    current: number;
    total: number;
    colorFrom?: string;
    colorTo?: string;
}

export function ProgressBar({ current, total, colorFrom = 'from-indigo-500', colorTo = 'to-purple-500' }: ProgressBarProps) {
    const progress = Math.min(100, Math.max(0, (current / total) * 100));

    return (
        <div className="max-w-2xl mx-auto mb-2">
            <div className="bg-white rounded-full h-3 overflow-hidden shadow-inner w-full">
                <div
                    className={`h-full bg-linear-to-r ${colorFrom} ${colorTo} transition-all duration-300 ease-out`}
                    style={{ width: `${progress}%` }}
                />
            </div>
             <div className="flex items-center justify-between mt-2 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                <span>Question {current} of {total}</span>
                <span>{Math.round(progress)}% Complete</span>
            </div>
        </div>
    );
}
