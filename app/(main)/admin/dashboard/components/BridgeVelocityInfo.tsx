'use client';

import { Info, X } from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const BridgeVelocityInfo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative inline-block ml-1 align-middle">
      {/* Ghost-style Trigger Icon */}
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1 text-text-tertiary hover:text-indigo-400 transition-colors focus:outline-none"
        aria-label="Bridge Velocity Information"
      >
        <Info size={16} />
      </button>

      {/* Overlay Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-canvas/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-surface rounded-2xl shadow-2xl border border-border-default overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-text-primary">Bridge Velocity</h3>
                    <p className="text-xs text-text-tertiary mt-1">Understanding relationship momentum</p>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)} 
                    className="p-1 text-text-tertiary hover:text-text-secondary transition-colors rounded-lg hover:bg-subtle"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Vertical Information Stack */}
                <div className="space-y-5 text-sm text-text-secondary">
                  <div className="flex gap-4">
                    <div className="w-1.5 h-12 bg-border-strong rounded-full shrink-0" />
                    <div>
                      <p className="font-semibold text-text-primary">Requests (Grey)</p>
                      <p className="text-text-tertiary">The raw number of outreach attempts or intro requests initiated.</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="w-1.5 h-12 bg-green-500 rounded-full shrink-0" />
                    <div>
                      <p className="font-semibold text-text-primary">Approvals (Green)</p>
                      <p className="text-text-tertiary">Successful connections—when a contact replies or an intro is accepted.</p>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-indigo-50/50 rounded-xl italic border border-indigo-100/50 text-indigo-900 leading-relaxed">
                    &quot;The Gap&quot; between lines represents your <strong className="text-indigo-600">Social Friction</strong>. A tighter gap means higher resonance.
                  </div>

                  <div className="pt-4 border-t border-border-default text-center">
                    <div className="inline-block px-3 py-1 bg-subtle rounded-lg font-mono text-[10px] text-indigo-600">
                      {'$\\text{Velocity} = \\frac{\\sum \\text{Approvals}}{\\Delta \\text{Time}}$'}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="w-full mt-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
