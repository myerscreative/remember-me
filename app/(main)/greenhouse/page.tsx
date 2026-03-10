import { FeedbackForm } from '@/components/feedback-form';
import { Sprout } from 'lucide-react';

export default function GreenhousePage() {
  return (
    <div className="container max-w-2xl mx-auto px-4 py-8 md:py-12">
      <div className="flex flex-col items-center text-center space-y-4 mb-10">
        <div className="size-16 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/20 rotate-3">
          <Sprout size={32} />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
            The Greenhouse: <span className="text-emerald-400">Help Us Grow</span>
          </h1>
          <p className="text-gray-400 text-lg">
            Found a bug? Have an idea for a new feature? Plant your thoughts here.
          </p>
        </div>
      </div>

      <div className="bg-[#161926]/50 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 size-48 bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-48 bg-emerald-500/10 blur-[100px] pointer-events-none" />
        
        <FeedbackForm />
      </div>
      
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-500">
          ReMember Me Beta &bull; Greenhouse V1.0
        </p>
      </div>
    </div>
  );
}
