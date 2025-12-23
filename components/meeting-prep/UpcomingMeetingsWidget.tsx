"use client";

import React from "react";
import { MockMeeting, mockUpcomingMeetings } from "@/lib/data/mock-meetings";
import { cn } from "@/lib/utils";
import { Video, MapPin, ArrowRight, Coffee } from "lucide-react";

interface UpcomingMeetingsWidgetProps {
  onOpenPrep: (meetingId: string) => void;
}

export function UpcomingMeetingsWidget({ onOpenPrep }: UpcomingMeetingsWidgetProps) {
  // Group meetings
  const today = new Date("2024-02-17T00:00:00Z"); // Using mock date as "today" for visualization
  const meetings = mockUpcomingMeetings;

  const getMeetingGroup = (meeting: MockMeeting) => {
    const meetingDate = new Date(meeting.startTime);
    const diffTime = meetingDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (meetingDate.getDate() === today.getDate()) return "Today";
    if (meetingDate.getDate() === today.getDate() + 1) return "Tomorrow";
    return "This Week";
  };

  const groupedMeetings = {
    Today: meetings.filter(m => getMeetingGroup(m) === "Today"),
    Tomorrow: meetings.filter(m => getMeetingGroup(m) === "Tomorrow"),
    ThisWeek: meetings.filter(m => getMeetingGroup(m) === "This Week")
  };

  if (meetings.length === 0) return null;

  return (
    <section className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 mb-8 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📅</span> Upcoming Meetings
        </h2>
        <button className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 font-medium text-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
          View All →
        </button>
      </div>

      <div className="flex flex-col gap-6">
        {/* Today */}
        {groupedMeetings.Today.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Today</div>
            {groupedMeetings.Today.map(meeting => (
              <MeetingCard key={meeting.id} meeting={meeting} onClick={() => onOpenPrep(meeting.id)} />
            ))}
          </div>
        )}

        {/* Tomorrow */}
        {groupedMeetings.Tomorrow.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Tomorrow</div>
            {groupedMeetings.Tomorrow.map(meeting => (
               <MeetingCard key={meeting.id} meeting={meeting} onClick={() => onOpenPrep(meeting.id)} />
            ))}
          </div>
        )}

        {/* This Week */}
        {groupedMeetings.ThisWeek.length > 0 && (
          <div className="space-y-3">
             <div className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">This Week</div>
             {groupedMeetings.ThisWeek.map(meeting => (
               <MeetingCard key={meeting.id} meeting={meeting} onClick={() => onOpenPrep(meeting.id)} />
             ))}
          </div>
        )}
      </div>
    </section>
  );
}

function MeetingCard({ meeting, onClick }: { meeting: MockMeeting; onClick: () => void }) {
  const isUrgent = meeting.startTime.includes("14:00"); // Mock logic for demo
  const isOverdue = meeting.id === "meeting_2"; // Mock logic
  const isImportant = meeting.importance === "critical";
  const isFirstMeeting = meeting.isFirstMeeting;

  const getLocationIcon = (loc: string) => {
    if (loc.toLowerCase().includes("zoom") || loc.toLowerCase().includes("video")) return <Video className="w-3.5 h-3.5" />;
    if (loc.toLowerCase().includes("coffee") || loc.toLowerCase().includes("starbucks")) return <Coffee className="w-3.5 h-3.5" />;
    return <MapPin className="w-3.5 h-3.5" />;
  };

  const getUrgencyBadge = () => {
    if (isUrgent) {
      return <span className="px-2.5 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-bold whitespace-nowrap">In 2 hours</span>;
    }
    if (isOverdue) {
      return <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-xs font-bold whitespace-nowrap">⚠️ Overdue</span>;
    }
    if (isImportant) {
      return <span className="px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 rounded-lg text-xs font-bold whitespace-nowrap">🌟 Important</span>;
    }
    return null;
  };

  const containerClasses = cn(
    "flex flex-col sm:flex-row gap-4 p-5 bg-gray-50 dark:bg-gray-800/50 border-2 rounded-2xl cursor-pointer transition-all hover:bg-white dark:hover:bg-gray-800 hover:shadow-lg hover:-translate-y-0.5",
    isFirstMeeting ? "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50" : "border-gray-200 dark:border-gray-700"
  );

  const hoverBorderColor = "hover:border-indigo-500 dark:hover:border-indigo-400";

  return (
    <div 
      onClick={onClick}
      className={cn(containerClasses, hoverBorderColor)}
    >
      {/* Time Column */}
      <div className="flex sm:flex-col items-start sm:items-center gap-2 sm:min-w-[100px] border-b sm:border-b-0 sm:border-r border-gray-200 dark:border-gray-700 pb-3 sm:pb-0 pr-0 sm:pr-4">
        {getUrgencyBadge()}
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {new Date(meeting.startTime).toLocaleTimeString([], {hour: 'numeric', minute:'2-digit'})}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md shrink-0">
            {meeting.contact.initials}
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white leading-tight">{meeting.contact.name}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{meeting.title}</p>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
          {getLocationIcon(meeting.location)}
          {meeting.location}
        </div>

        {/* Badges */}
        <div className="flex gap-2 flex-wrap">
          {meeting.contact.lastContact.daysAgo ? (
             <span className="px-2 py-1 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md text-xs text-gray-500 dark:text-gray-400">
               Last contact: {meeting.contact.lastContact.daysAgo} days ago
             </span>
          ) : (
            <span className="px-2 py-1 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md text-xs text-gray-500 dark:text-gray-400">
               ⭐ First meeting
             </span>
          )}
          {meeting.mutualConnections.length > 0 && (
             <span className="px-2 py-1 bg-white dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md text-xs text-gray-500 dark:text-gray-400">
               {meeting.mutualConnections.length} mutual connections
             </span>
          )}
        </div>
      </div>

      {/* Action Button */}
      <div className="flex items-center sm:self-center mt-2 sm:mt-0">
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-full sm:w-auto px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-md shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
        >
          Prep Now <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
