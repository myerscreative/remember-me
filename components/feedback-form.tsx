'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sprout, Bug, Lightbulb, Layout, Heart, Camera, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { submitFeedback } from '@/app/actions/submit-feedback';
import { cn } from '@/lib/utils';

const categories = [
  { id: 'bug', label: "Bug (Something&apos;s broken)", icon: Bug, color: 'text-red-500' },
  { id: 'idea', label: 'Idea (Feature request)', icon: Lightbulb, color: 'text-amber-500' },
  { id: 'ui/ux', label: 'UI/UX (Confusing layout)', icon: Layout, color: 'text-blue-500' },
  { id: 'love', label: "Love (What&apos;s working well)", icon: Heart, color: 'text-pink-500' },
];

export function FeedbackForm() {
  const pathname = usePathname();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory || !description) {
      toast.error('Please select a category and provide a description');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('category', selectedCategory);
      formData.append('description', description);
      formData.append('currentPage', pathname);
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      const result = await submitFeedback(formData);

      if (result.success) {
        setIsSuccess(true);
        toast.success("Your feedback has been planted!");
      } else {
        toast.error(result.error || 'Failed to submit feedback');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
        <div className="size-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
          <Sprout size={32} />
        </div>
        <h3 className="text-xl font-semibold text-white">Your feedback has been planted.</h3>
        <p className="text-emerald-100/70 max-w-xs">
          We&apos;re on it! Thank you for helping ReMember Me grow.
        </p>
        <button
          onClick={() => {
            setIsSuccess(false);
            setSelectedCategory(null);
            setDescription('');
            setScreenshot(null);
          }}
          className="mt-4 px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full transition-colors text-sm font-medium"
        >
          Plant more thoughts
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400">Category</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 text-left",
                  isSelected 
                    ? "bg-indigo-500/20 border-indigo-500 ring-2 ring-indigo-500/20" 
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                )}
              >
                <div className={cn("size-8 rounded-lg flex items-center justify-center", isSelected ? "bg-indigo-500 text-white" : "bg-white/5", !isSelected && cat.color)}>
                  <Icon size={18} />
                </div>
                <span className={cn("text-sm font-medium", isSelected ? "text-white" : "text-gray-300")}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label htmlFor="description" className="text-sm font-medium text-gray-400">Tell us more...</label>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What&apos;s on your mind? The more detail the better..."
          className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none"
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-medium text-gray-400">Screenshot (Optional)</label>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl cursor-pointer transition-colors text-sm text-gray-300">
            <Camera size={18} />
            <span>{screenshot ? 'Change Screenshot' : 'Upload Screenshot'}</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
            />
          </label>
          {screenshot && (
            <span className="text-xs text-gray-500 truncate max-w-[200px]">
              {screenshot.name}
            </span>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={20} />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <Send size={18} />
            <span>Send to Architect</span>
          </>
        )}
      </button>
    </form>
  );
}
