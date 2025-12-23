"use client";

import { useState } from "react";
import { CalendarStatus } from "@/components/calendar/CalendarStatus";
import { MatchedEventsList } from "@/components/calendar/MatchedEventsList";
import { UpcomingMeetingsWidget } from "@/components/meeting-prep/UpcomingMeetingsWidget";
import { MeetingPrepOverlay } from "@/components/meeting-prep/MeetingPrepOverlay";
import { mockUpcomingMeetings } from "@/lib/data/mock-meetings";

export function MeetingPrepContent() {
  const [prepMeetingId, setPrepMeetingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Calendar Connection Status */}
      <CalendarStatus />
      
      {/* Upcoming Meetings Widget */}
      <UpcomingMeetingsWidget onOpenPrep={(id) => setPrepMeetingId(id)} />
      
      {/* Matched Events List */}
      <MatchedEventsList />
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">This Week</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">Active</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">meetings</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ready to Prep</p>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Check</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">with contacts</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status</p>
          <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">Live</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">updates</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Priority</p>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">Top</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">important</p>
        </div>
      </div>
      
      {/* Tips Section */}
      <div className="bg-linear-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-8 border border-indigo-200 dark:border-indigo-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          💡 Pro Tips
        </h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 text-sm font-bold">
              1
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Review context 15 minutes before:</strong> Quick refresh of key points helps conversations flow naturally
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 text-sm font-bold">
              2
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Update notes after meetings:</strong> Capture important details while they&apos;re fresh
            </p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center shrink-0 text-sm font-bold">
              3
            </div>
            <p className="text-gray-700 dark:text-gray-300">
              <strong>Make introductions:</strong> When you spot mutual connections, help your network grow
            </p>
          </div>
        </div>
      </div>

      {/* Meeting Prep Overlay */}
      <MeetingPrepOverlay 
        meeting={mockUpcomingMeetings.find(m => m.id === prepMeetingId) || null} 
        isOpen={!!prepMeetingId} 
        onClose={() => setPrepMeetingId(null)} 
      />
    </div>
  );
}
