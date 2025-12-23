'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mail, MessageSquare, Plus } from 'lucide-react';
import { LogInteractionModal } from '@/components/modals/LogInteractionModal';

interface ActionButtonsProps {
  contactId: string;
  phoneNumber?: string;
  email?: string;
}

export function ActionButtons({ contactId, phoneNumber, email }: ActionButtonsProps) {
  const [isLogModalOpen, setLogModalOpen] = useState(false);
  const [interactionType, setInteractionType] = useState<'call' | 'email' | 'text' | 'meeting'>('call');

  const handleAction = (type: 'call' | 'email' | 'text', actionUrl: string) => {
    // 1. Trigger Native Action
    window.location.href = actionUrl;
    
    // 2. Open Modal (Intention over Automation) - Optimistic UI
    setInteractionType(type);
    // Brief delay to allow the browser to handle the protocol handler before showing the modal
    setTimeout(() => setLogModalOpen(true), 1500); 
  };

  return (
    <>
      <div className="grid grid-cols-4 gap-3 w-full max-w-md mx-auto mb-6">
        {/* Primary Actions */}
        {phoneNumber ? (
          <Button 
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex gap-2 items-center"
            onClick={() => handleAction('call', `tel:${phoneNumber}`)}
          >
            <Phone className="w-4 h-4" /> Call
          </Button>
        ) : (
             <Button variant="default" disabled className="bg-emerald-600/50 text-white flex gap-2 items-center opacity-50 cursor-not-allowed">
               <Phone className="w-4 h-4" /> Call
            </Button>
        )}
        
        {email ? (
          <Button 
            variant="outline"
            className="flex gap-2 items-center"
            onClick={() => handleAction('email', `mailto:${email}`)}
          >
            <Mail className="w-4 h-4" /> Email
          </Button>
        ) : (
            <Button variant="outline" disabled className="flex gap-2 items-center opacity-50 cursor-not-allowed">
               <Mail className="w-4 h-4" /> Email
            </Button>
        )}

        {phoneNumber ? (
           <Button 
             variant="outline"
             className="flex gap-2 items-center"
             onClick={() => handleAction('text', `sms:${phoneNumber}`)}
           >
             <MessageSquare className="w-4 h-4" /> Text
           </Button>
        ) : (
             <Button variant="outline" disabled className="flex gap-2 items-center opacity-50 cursor-not-allowed">
                <MessageSquare className="w-4 h-4" /> Text
             </Button>
        )}

         {/* Manual Log Button */}
         <Button 
          variant="ghost"
          size="icon"
          onClick={() => {
             setInteractionType('call'); // Default
             setLogModalOpen(true);
          }}
          title="Log generic interaction"
          className="hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Plus className="w-5 h-5 text-gray-500" />
        </Button>
      </div>

      <LogInteractionModal 
        isOpen={isLogModalOpen} 
        onClose={() => setLogModalOpen(false)}
        contactId={contactId}
        initialType={interactionType}
      />
    </>
  );
}
