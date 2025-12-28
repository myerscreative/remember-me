'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { updateTargetFrequency } from '@/app/actions/update-target-frequency';
import { ArrowLeft, Loader2, Sparkles, Calendar, Wind, Sun } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface SetupContact {
  id: string;
  name: string;
  initials: string;
}

export default function GardenSetupPage() {
  const [contacts, setContacts] = useState<SetupContact[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUncategorized() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('persons')
        .select('id, name, first_name, last_name')
        .eq('user_id', user.id)
        .is('target_frequency_days', null)
        .eq('archived', false);

      if (error) {
        console.error('Error fetching uncategorized contacts:', error);
        toast.error('Failed to load contacts');
      } else {
        const processed = data.map((p: any) => ({
          id: p.id,
          name: p.name || `${p.first_name} ${p.last_name || ''}`.trim(),
          initials: ((p.first_name?.[0] || '') + (p.last_name?.[0] || p.name?.[0] || '')).toUpperCase()
        }));
        setContacts(processed);
      }
      setLoading(false);
    }

    fetchUncategorized();
  }, []);

  const handleSelection = async (frequency: number) => {
    if (currentIndex >= contacts.length) return;
    
    setUpdating(true);
    const contact = contacts[currentIndex];
    const result = await updateTargetFrequency(contact.id, frequency);
    
    if (result.success) {
      if (currentIndex + 1 >= contacts.length) {
        toast.success('Garden setup complete! ✨');
        router.push('/garden');
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      toast.error('Failed to update contact');
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex flex-col items-center justify-center p-4">
        <Sparkles className="w-16 h-16 text-indigo-400 mb-6" />
        <h2 className="text-2xl font-bold text-white mb-2">Your Garden is Fully Categorized!</h2>
        <p className="text-slate-400 mb-8 max-w-md text-center">
          All your contacts have frequency targets set. Your relationship health is being tracked.
        </p>
        <Link href="/garden" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all">
          Go to Garden Map
        </Link>
      </div>
    );
  }

  const currentContact = contacts[currentIndex];
  const progress = ((currentIndex) / contacts.length) * 100;

  return (
    <div className="min-h-screen bg-[#0B1120] text-white font-sans selection:bg-indigo-500/30">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link href="/garden" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Garden
        </Link>

        <div className="mb-12">
          <h1 className="text-4xl font-extrabold mb-2 bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Nurturing your Garden...
          </h1>
          <p className="text-slate-400">
            Set a connection rhythm for each person to activate health tracking.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-medium text-slate-400">Progress</span>
            <span className="text-sm font-bold text-indigo-400">{currentIndex} / {contacts.length}</span>
          </div>
          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </div>
        </div>

        {/* Contact Card */}
        <div className="relative h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentContact.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: -100, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
              className="absolute inset-0 bg-[#1E293B]/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-10 flex flex-col items-center justify-center text-center shadow-2xl"
            >
              <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-full flex items-center justify-center text-3xl font-bold mb-6 shadow-lg shadow-indigo-500/20">
                {currentContact.initials}
              </div>
              <h2 className="text-3xl font-bold mb-2">{currentContact.name}</h2>
              <p className="text-slate-400 mb-10">How often would you like to stay in touch?</p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                <button
                  disabled={updating}
                  onClick={() => handleSelection(14)}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-800/50 hover:bg-emerald-500/10 border border-slate-700 hover:border-emerald-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Wind className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Bi-Weekly</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Every 14 days</span>
                </button>

                <button
                  disabled={updating}
                  onClick={() => handleSelection(30)}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-800/50 hover:bg-indigo-500/10 border border-slate-700 hover:border-indigo-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Calendar className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Monthly</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Every 30 days</span>
                </button>

                <button
                  disabled={updating}
                  onClick={() => handleSelection(90)}
                  className="group flex flex-col items-center gap-3 p-5 rounded-2xl bg-slate-800/50 hover:bg-amber-500/10 border border-slate-700 hover:border-amber-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Sun className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Quarterly</span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Every 90 days</span>
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Setting these targets allows the Garden to calculate "Health Status"<br/>
            based on your actual interactions.
          </p>
        </div>
      </div>
    </div>
  );
}
