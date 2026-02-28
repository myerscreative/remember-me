import React from 'react';
import { motion } from 'framer-motion';

interface LeafIconProps {
  className?: string;
}

export function LeafIcon({ className }: LeafIconProps) {
  // A hand-drawn style, slightly curved leaf Path
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="none"
      className={className}
    >
      <path d="M12 2C7 2 3 6 3 12C3 18.2 8.7 20.3 12 22C12 22 13 18 13 14C13 10 16 6 21 6C21 2 16 2 12 2ZM11.5 13.5C11 11 9 9 7.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </motion.svg>
  );
}
