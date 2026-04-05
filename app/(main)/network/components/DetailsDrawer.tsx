import React from 'react';
import { X, Mail, Phone, MessageSquare, MapPin } from 'lucide-react';
import Image from 'next/image';
import { Contact } from '../mockContacts';
import { calculateDaysAgo, getContactStatus, formatRelativeTime, getMethodIcon, getMethodLabel } from '../utils/dateUtils';
import { cn } from '@/lib/utils';

interface DetailsDrawerProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailsDrawer({ contact, isOpen, onClose }: DetailsDrawerProps) {
  if (!contact) return null;

  const daysAgo = calculateDaysAgo(contact.lastContact?.date);
  const status = getContactStatus(daysAgo);
  const relativeTime = formatRelativeTime(daysAgo);
  const methodIcon = getMethodIcon(contact.lastContact?.method);
  const methodLabel = getMethodLabel(contact.lastContact?.method);

  let statusColorClass = 'text-text-secondary bg-canvas border-border-default';
  if (status === 'good') statusColorClass = 'text-green-800 bg-green-50 border-green-200';
  else if (status === 'warning') statusColorClass = 'text-yellow-800 bg-yellow-50 border-yellow-200';
  else if (status === 'overdue') statusColorClass = 'text-red-800 bg-red-50 border-red-200';

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn("fixed inset-0 z-[100] bg-black/20 backdrop-blur-sm transition-opacity duration-300", isOpen ? "opacity-100" : "pointer-events-none opacity-0")}
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div 
        className={cn("fixed top-0 right-0 h-full w-full overflow-y-auto bg-surface shadow-2xl transition-transform duration-300 ease-in-out sm:w-[400px] z-[101]", isOpen ? "translate-x-0" : "translate-x-full")}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Contact Details</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-subtle rounded-full text-text-secondary transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Profile Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-24 h-24 rounded-full bg-indigo-100 flex items-center justify-center text-3xl font-bold text-indigo-600 mb-4 overflow-hidden border-4 border-surface shadow-lg">
              {contact.photo ? (
                <Image src={contact.photo} alt={contact.name} width={96} height={96} className="w-full h-full object-cover" />
              ) : (
                contact.initials
              )}
            </div>
            <h3 className="text-2xl font-bold text-text-primary">{contact.name}</h3>
            <p className="text-text-secondary font-medium">{contact.role}</p>
            <div className="flex items-center gap-1.5 mt-2 text-sm text-text-secondary">
              <MapPin size={14} />
              {contact.location}
            </div>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-canvas hover:bg-indigo-50 hover:text-indigo-600 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-surface border border-border-default flex items-center justify-center text-text-tertiary group-hover:border-indigo-200 group-hover:text-text-accent">
                <Mail size={18} />
              </div>
              <span className="text-xs font-medium">Email</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-canvas hover:bg-indigo-50 hover:text-indigo-600 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-surface border border-border-default flex items-center justify-center text-text-tertiary group-hover:border-indigo-200 group-hover:text-text-accent">
                <Phone size={18} />
              </div>
              <span className="text-xs font-medium">Call</span>
            </button>
            <button className="flex flex-col items-center gap-2 p-3 rounded-lg bg-canvas hover:bg-indigo-50 hover:text-indigo-600 transition-colors group">
              <div className="w-10 h-10 rounded-full bg-surface border border-border-default flex items-center justify-center text-text-tertiary group-hover:border-indigo-200 group-hover:text-text-accent">
                <MessageSquare size={18} />
              </div>
              <span className="text-xs font-medium">Text</span>
            </button>
          </div>

          {/* Last Contact */}
          <section className="mb-8 p-4 rounded-xl border border-border-default bg-canvas/50">
            <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Last Contact</h4>
            <div className={cn("flex items-center gap-3 rounded-lg border p-3", statusColorClass)}>
              <span className="text-xl">{methodIcon}</span>
              <div>
                <p className="font-semibold text-sm">
                  {methodLabel} <span className="font-normal opacity-75">• {relativeTime}</span>
                </p>
                {status === 'overdue' && (
                  <p className="text-xs font-medium mt-0.5 text-red-600 flex items-center gap-1">
                    ⚠️ Overdue for connection
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Interests */}
          <section className="mb-8">
            <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Interests</h4>
            <div className="flex flex-wrap gap-2">
              {contact.interests.map((interest, idx) => (
                <span key={idx} className="px-3 py-1.5 rounded-full bg-subtle text-text-tertiary text-sm font-medium border border-border-default">
                  {interest}
                </span>
              ))}
            </div>
          </section>

          {/* Tags */}
          <section className="mb-8">
             <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Tags</h4>
             <div className="flex flex-wrap gap-2">
               {contact.tags.map((tag, idx) => (
                 <span key={idx} className="px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">
                   #{tag}
                 </span>
               ))}
             </div>
          </section>

          {/* The Story (Placeholder) */}
          <section className="mb-8">
            <h4 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">📖 The Story</h4>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-900 text-sm">
              <div className="font-medium mb-1">📍 Where We Met</div>
              <p className="opacity-80">Met at the annual tech conference in Austin last year. Connected over coffee break discussion about AI.</p>
            </div>
          </section>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-surface/60 backdrop-blur-md py-4 border-t border-border-default flex flex-col gap-3">
             <button className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors shadow-sm">
               View Full Profile
             </button>
             <button className="w-full py-2.5 bg-surface text-text-tertiary border border-border-strong rounded-lg font-medium hover:bg-canvas transition-colors">
               Edit Contact
             </button>
          </div>
        </div>
      </div>
    </>
  );
}
