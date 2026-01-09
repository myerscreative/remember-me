'use client';

import toast from "react-hot-toast";

export const showNurtureToast = (name: string) => {
  toast.success(`Connection nurtured! Your garden seed for ${name} is healthy.`, {
    duration: 3000,
    position: 'bottom-center',
    icon: '🌱',
    style: {
      background: '#161926',
      color: '#fff',
      border: '1px solid rgba(16, 185, 129, 0.3)',
      borderRadius: '1rem',
      padding: '1rem',
    },
  });
};
