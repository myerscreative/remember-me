"use client";

import React, { useEffect, useState } from "react";
import { 
  X, 
  ArrowLeft, 
  MapPin, 
  Clock, 
  Video, 
  Phone, 
  MessageSquare, 
  Users, 
  Target, 
  ExternalLink,
  Brain,
  ArrowRight
} from "lucide-react";
import { MockMeeting } from "@/lib/data/mock-meetings";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface MeetingPrepOverlayProps {
  meeting: MockMeeting | null;
  isOpen: boolean;
  onClose: () => void;
}


// Add this function to generate starters dynamically
async function generateConversationStarters(contact: any, meeting: any) {
  try {
    const response = await fetch('/api/ai/generate-starters', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contactContext: {
          name: contact.name,
          whereWeMet: contact.whereWeMet,
          whenWeMet: contact.whenWeMet,
          howWeMet: contact.howWeMet,
          whatWeTalkedAbout: contact.whatWeTalkedAbout,
          whyStayInContact: contact.whyStayInContact,
          whatMattersToThem: contact.whatMattersToThem,
          lastContact: contact.lastContact,
          interests: contact.interests,
          meetingTitle: meeting.title,
          meetingType: meeting.isFirstMeeting ? 'first-meeting' : 'follow-up',
        },
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate starters');
    }

    return data.starters;
  } catch (error) {
    console.error('Error generating starters:', error);
    
    // Return fallback starters
    return [
      `How have things been since we last connected?`,
      `What have you been working on lately?`,
      `How's everything going with ${contact.name}?`,
      `Any updates since we last talked?`,
    ];
  }
}

export function MeetingPrepOverlay({ meeting, isOpen, onClose }: MeetingPrepOverlayProps) {
  const router = useRouter();
  const [conversationStarters, setConversationStarters] = useState<string[]>([]);
  const [isGeneratingStarters, setIsGeneratingStarters] = useState(false);

  // Move this above useEffect
  const loadConversationStarters = React.useCallback(async () => {
    if (!meeting) return;
    
    setIsGeneratingStarters(true);
    
    try {
      const starters = await generateConversationStarters(
        meeting.contact,
        meeting
      );
      setConversationStarters(starters);
    } catch (error) {
      console.error('Failed to load starters:', error);
    } finally {
      setIsGeneratingStarters(false);
    }
  }, [meeting]);

  // Reset state when meeting changes or opens
  useEffect(() => {
    if (meeting) {
      // Initialize with existing starters if any, otherwise empty to trigger generation
      setConversationStarters(meeting.conversationStarters || []);
      
      // If no starters exist, generate them
      if ((!meeting.conversationStarters || meeting.conversationStarters.length === 0) && isOpen) {
        loadConversationStarters();
      }
    }
  }, [meeting?.id, isOpen, loadConversationStarters]);
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen || !meeting) return null;

  const { contact } = meeting;

  // Helper to calculate time until
  const getTimeUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours < 1) return `In ${minutes} minutes`;
    if (hours < 24) return `In ${hours} hours`;
    const days = Math.floor(hours / 24);
    return `In ${days} ${days === 1 ? 'day' : 'days'}`;
  };

  const timeUntil = getTimeUntil(meeting.startTime);
  const locationIsZoom = meeting.location.toLowerCase().includes("zoom") || meeting.location.toLowerCase().includes("video");

  return (
    <div 
      className="fixed inset-0 z-[2000] bg-black/50 overflow-y-auto backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Container - Responsive width */}
      <div className="relative w-full max-w-[800px] mx-auto min-h-screen md:min-h-0 md:my-8 bg-white dark:bg-gray-900 md:rounded-3xl shadow-2xl overflow-hidden flex flex-col">

        {/* --- Header (Sticky) --- */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-4 md:px-8 md:py-6 flex justify-between items-center shadow-sm">
          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📅</span> Meeting Prep
          </h1>

          <button
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- Content (Desktop View) --- */}
        <div className="hidden md:block">
          {/* Meeting Info Banner */}
          <div className="px-8 py-8 bg-linear-to-br from-blue-50 to-blue-100 dark:from-gray-800 dark:to-gray-800 border-b-2 border-indigo-500 flex gap-6 items-center">
            <div className="w-20 h-20 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-indigo-500/30">
              {contact.initials}
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Meeting with {contact.name}</h2>
              <div className="flex flex-wrap gap-4 text-gray-600 dark:text-gray-300 font-medium text-sm md:text-base mb-3">
                <span className="flex items-center gap-1.5">
                  📅 Today at {new Date(meeting.startTime).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> {timeUntil}
                </span>
                <span className="flex items-center gap-1.5">
                  {locationIsZoom ? <Video className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                  {meeting.location}
                </span>
              </div>
              {meeting.locationUrl && (
                <a
                  href={meeting.locationUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold text-sm transition-transform hover:translate-x-1"
                >
                  Join Meeting <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Context Bar */}
          <div className="flex flex-wrap gap-4 px-8 py-6 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium shadow-sm">
              <MessageSquare className="w-4 h-4 text-gray-400" />
              <span>Last spoke: {contact.lastContact.daysAgo ? `${contact.lastContact.daysAgo} days ago` : 'Never'}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium shadow-sm">
              <Users className="w-4 h-4 text-gray-400" />
              <span>{meeting.mutualConnections.length} mutual connections</span>
            </div>
            {meeting.importance === 'high' || meeting.importance === 'critical' ? (
              <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-200 font-medium shadow-sm">
                <Target className="w-4 h-4 text-red-500" />
                <span className="capitalize">{meeting.importance} priority</span>
              </div>
            ) : null}
          </div>

          {/* The Story */}
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              📖 The Story
            </h3>

            <div className="grid gap-6">
              {/* Where We Met */}
              <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mt-1">📍</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Where We Met</h4>
                  <p className="text-base text-gray-900 dark:text-white mb-1 font-medium">{contact.whereWeMet} - {contact.whenWeMet}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic">{contact.howWeMet}</p>
                </div>
              </div>

              {/* What We Talked About */}
              <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mt-1">💭</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">What We Talked About</h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-gray-700 dark:text-gray-300">
                    {contact.whatWeTalkedAbout.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Why Stay in Contact */}
              <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mt-1">❤️</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Why Stay in Contact</h4>
                  <p className="text-gray-900 dark:text-gray-200">{contact.whyStayInContact}</p>
                </div>
              </div>

              {/* What Matters to Them */}
              <div className="flex gap-4 p-5 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl mt-1">👨‍👩‍👧</div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">What Matters to Them</h4>
                  <ul className="list-disc pl-4 space-y-1.5 text-gray-700 dark:text-gray-300">
                    {contact.whatMattersToThem.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Last Contact */}
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              📞 Last Contact
            </h3>
            <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 rounded-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-600 rounded-lg text-emerald-800 dark:text-emerald-400 text-sm font-bold">
                  {contact.lastContact.method === 'phone' ? <Phone className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                  <span className="capitalize">{contact.lastContact.method || 'Unknown'}</span>
                </span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                  {contact.lastContact.daysAgo ? `${contact.lastContact.daysAgo} days ago` : ''} ({contact.lastContact.date})
                </span>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-xl text-emerald-900 dark:text-emerald-300 italic border border-emerald-100 dark:border-emerald-700">
                "{contact.lastContact.notes}"
              </div>
            </div>
          </div>

          {/* Conversation Starters */}
          <div className="px-8 py-8 mx-8 my-4 bg-linear-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-2 border-amber-300 dark:border-amber-600 rounded-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                🎯 Conversation Starters
              </h3>
              <button
                onClick={loadConversationStarters}
                disabled={isGeneratingStarters}
                className="px-3 py-1 text-sm bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 border border-indigo-300 dark:border-indigo-600 rounded-lg hover:bg-indigo-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {isGeneratingStarters ? '✨ Generating...' : '🔄 Regenerate'}
              </button>
            </div>

            {isGeneratingStarters ? (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Generating personalized questions...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversationStarters.map((starter, i) => (
                  <div key={i} className="flex gap-4 items-start p-4 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-amber-100 dark:border-amber-700">
                    <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-amber-400 text-white font-bold rounded-full">
                      {i + 1}
                    </span>
                    <p className="text-gray-900 dark:text-gray-100 pt-1 text-lg">{starter}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Practice Mode */}
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-700">
             <div className="flex items-center justify-between mb-4">
                 <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Brain className="text-indigo-500" /> Practice Mode
                 </h3>
                 <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Beta</span>
             </div>

             <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-800">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                     <div className="flex-1">
                         <h4 className="font-bold text-gray-900 dark:text-white mb-2">Want to drill before the meeting?</h4>
                         <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                            Take a quick 2-minute quiz to sharpen your memory.
                         </p>
                         <div className="flex flex-wrap gap-2">
                             <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700">
                                📖 Story Recall
                             </Button>
                             <Button size="sm" variant="outline" className="bg-white dark:bg-gray-800 hover:bg-pink-50 dark:hover:bg-gray-700 text-pink-700 dark:text-pink-400 border-pink-200 dark:border-pink-700">
                                🎯 Interest Check
                             </Button>
                         </div>
                     </div>
                     <div className="shrink-0">
                         <Button
                            onClick={() => {
                                onClose();
                                router.push('/practice');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50"
                        >
                            Start Practice <ArrowRight className="ml-2 w-4 h-4" />
                         </Button>
                     </div>
                 </div>
             </div>
          </div>

          {/* Mutual Connections */}
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              🤝 People You Should Connect
            </h3>
            <div className="space-y-4">
              {meeting.mutualConnections.map((conn) => (
                <div key={conn.id} className="p-5 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-white dark:hover:bg-gray-750 hover:border-indigo-500 transition-colors group">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">
                      {conn.initials}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white text-lg">{conn.name}</h4>
                      <p className="text-gray-500 dark:text-gray-400">{conn.role}</p>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex gap-2 mb-3">
                      {conn.sharedInterests.map(interest => (
                        <span key={interest} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold uppercase">
                          {interest}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{conn.matchReason}</p>
                  </div>
                  <Button className="w-full bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-500 hover:bg-indigo-600 hover:text-white transition-colors">
                    Suggest Introduction
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="px-8 py-8 border-b border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              📝 Pre-Meeting Notes
            </h3>
            <textarea
              className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/50 outline-none transition-all resize-none text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              rows={4}
              placeholder="Add any reminders or topics you want to cover..."
              defaultValue="Remember to mention the React conference coming up. She might be interested in attending together."
            />
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-8 flex gap-4 flex-wrap bg-gray-50 dark:bg-gray-800">
             <Button className="flex-1 min-w-[200px] h-12 text-base font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50">
               View Full Profile
             </Button>
             <Button variant="outline" className="flex-1 min-w-[200px] h-12 text-base font-semibold bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
               Edit Contact
             </Button>
             <Button variant="outline" className="flex-1 min-w-[200px] h-12 text-base font-semibold bg-white dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600">
               Add to Favorites ⭐
             </Button>
          </div>
        </div>

        {/* --- Mobile Swipeable View --- */}
        <div className="md:hidden flex-1 overflow-x-auto snap-x snap-mandatory flex bg-gray-100 dark:bg-gray-800 pb-8 pt-4 px-4 gap-4 no-scrollbar">

          {/* Card 1: Meeting Details */}
          <div className="min-w-[calc(100vw-2rem)] snap-start bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl flex flex-col items-center text-center overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 border-b dark:border-gray-700 pb-2 w-full">Meeting Details</div>

            <div className="w-24 h-24 rounded-full bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-xl shadow-indigo-200 dark:shadow-indigo-900/50 mb-4">
              {contact.initials}
            </div>

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{contact.name}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6 font-medium">{contact.role}</p>

            <div className="w-full bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col gap-2">
                <span className="font-semibold text-gray-900 dark:text-white">Today at {new Date(meeting.startTime).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}</span>
                <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-bold border border-red-100 dark:border-red-800 self-center">
                  {timeUntil}
                </span>
              </div>
            </div>

            {meeting.locationUrl ? (
               <a href={meeting.locationUrl} target="_blank" rel="noreferrer" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 mb-4 block">
                 Join Meeting
               </a>
            ) : (
              <div className="w-full py-4 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl font-bold mb-4 flex items-center justify-center gap-2">
                <MapPin className="w-5 h-5" /> {meeting.location}
              </div>
            )}

            <div className="mt-auto pt-4 text-gray-400 dark:text-gray-500 text-sm font-medium animate-pulse">
              ← Swipe for context →
            </div>
          </div>

          {/* Card 2: Key Context */}
          <div className="min-w-[calc(100vw-2rem)] snap-start bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl flex flex-col items-center overflow-y-auto max-h-[calc(100vh-180px)]">
             <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 border-b dark:border-gray-700 pb-2 w-full text-center">Key Context</div>

             <div className="w-full space-y-4">
               {/* Last Spoke */}
               <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-4 items-start text-left">
                  <span className="text-2xl">💭</span>
                  <div>
                    <strong className="block text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Last Spoke</strong>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {contact.lastContact.daysAgo ? `${contact.lastContact.daysAgo} days ago` : 'Never'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">"{contact.lastContact.notes}"</p>
                  </div>
               </div>

               {/* Matters */}
               {contact.whatMattersToThem[0] && (
                 <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-4 items-start text-left">
                    <span className="text-2xl">👨‍👩‍👧</span>
                    <div>
                      <strong className="block text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">What Matters</strong>
                      <p className="text-gray-900 dark:text-white font-medium">{contact.whatMattersToThem[0]}</p>
                    </div>
                 </div>
               )}

               {/* Shared Interest */}
               {meeting.mutualConnections[0]?.sharedInterests[0] && (
                 <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-4 items-start text-left">
                    <span className="text-2xl">🎣</span>
                    <div>
                      <strong className="block text-gray-500 dark:text-gray-400 text-xs uppercase mb-1">Shared Interest</strong>
                      <p className="text-gray-900 dark:text-white font-medium">
                        Both love {meeting.mutualConnections[0].sharedInterests[0]}
                      </p>
                    </div>
                 </div>
               )}
             </div>

             <div className="mt-auto pt-8 text-gray-400 dark:text-gray-500 text-sm font-medium">
              ← Swipe for more →
             </div>
          </div>

          {/* Card 3: Conversation Starters */}
          <div className="min-w-[calc(100vw-2rem)] snap-start bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-xl flex flex-col items-center overflow-y-auto max-h-[calc(100vh-180px)]">
            <div className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-6 border-b dark:border-gray-700 pb-2 w-full text-center">Say This</div>

            <div className="w-full space-y-4">
               {isGeneratingStarters ? (
                  <div className="py-8 text-center flex flex-col items-center justify-center w-full">
                    <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Generating...</p>
                  </div>
               ) : (
                 conversationStarters.slice(0, 3).map((starter, i) => (
                   <div key={i} className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl text-left flex gap-3">
                     <span className="w-6 h-6 bg-amber-400 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                     <p className="text-gray-900 dark:text-gray-100 leading-relaxed font-medium text-sm">"{starter}"</p>
                   </div>
                 ))
               )}
            </div>

            <Button className="w-full mt-auto py-6 bg-white dark:bg-gray-800 border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 font-bold rounded-2xl shadow-none">
              View Full Details →
            </Button>
          </div>

        </div>

        {/* Mobile Swipe Indicators (Bottom) */}
        <div className="md:hidden absolute bottom-6 left-0 right-0 flex justify-center gap-2 pointer-events-none">
           <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
           <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
           <div className="w-2 h-2 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
        </div>

      </div>
    </div>
  );
}
