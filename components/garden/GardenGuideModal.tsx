'use client';

import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface GardenGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GardenGuideModal({ isOpen, onClose }: GardenGuideModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-100"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-101"
          >
            <div className="bg-linear-to-br from-slate-900 to-[#0f172a] rounded-3xl shadow-2xl border border-slate-700 overflow-hidden h-full md:h-auto max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                    <span className="text-xl">🌹</span>
                  </div>
                  <h2 className="text-2xl font-bold text-white">Garden Guide</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Frequency Rings */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wide">
                    Contact Frequency Rings
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">High Priority (Center) - Weekly/Biweekly</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">Medium (Middle) - Monthly</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">Low (Outer) - Quarterly+</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm italic mt-3 pl-6">
                      Within each ring, recently contacted people appear closer to the inner edge
                    </p>
                  </div>
                </section>

                <div className="h-px bg-slate-700/50" />

                {/* Leaf Color (Health Status) */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wide">
                    Leaf Color (Health Status)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">Blooming (0-7 days)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-lime-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">Nourished (8-21 days)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-yellow-400 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">Thirsty (22-45 days)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-white font-medium">Fading (45+ days)</p>
                      </div>
                    </div>
                  </div>
                </section>

                <div className="h-px bg-slate-700/50" />

                {/* Leaf Size (Relationship Type) */}
                <section>
                  <h3 className="text-sm font-semibold text-slate-200 mb-4 uppercase tracking-wide">
                    Leaf Size (Relationship Type)
                  </h3>
                  <div className="flex items-center gap-6 justify-center py-4">
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-slate-600 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm">Contact</p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-slate-600 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm">Friend</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-600 mx-auto mb-2" />
                      <p className="text-slate-300 text-sm">Favorite</p>
                    </div>
                  </div>
                </section>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-slate-700/50 bg-slate-900/50">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-linear-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
                  Got it!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
