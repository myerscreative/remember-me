"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Bell, 
  Plus, 
  Check, 
  Clock, 
  Calendar,
  User,
  Trash2,
  Edit,
  Search
} from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  person_id?: string;
  person_name?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  created_at: string;
  user_id: string;
}

export default function RemindersPage() {
  const router = useRouter();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Fetch reminders with person information
      const { data: remindersData, error } = await supabase
        .from('reminders')
        .select(`
          *,
          persons (
            id,
            name,
            first_name,
            last_name
          )
        `)
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true });

      if (error) throw error;

      // Transform data to include person_name
      const transformedReminders = remindersData?.map(reminder => ({
        ...reminder,
        person_name: reminder.persons 
          ? (reminder.persons.first_name 
              ? `${reminder.persons.first_name} ${reminder.persons.last_name || ''}`
              : reminder.persons.name)
          : undefined
      })) || [];

      setReminders(transformedReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleComplete(reminderId: string, currentStatus: boolean) {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('reminders')
      .update({ completed: !currentStatus })
      .eq('id', reminderId);

    if (error) {
      console.error('Error updating reminder:', error);
      return;
    }

    // Update local state
    setReminders(reminders.map(r => 
      r.id === reminderId ? { ...r, completed: !currentStatus } : r
    ));
  }

  async function deleteReminder(reminderId: string) {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    const supabase = createClient();
    
    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', reminderId);

    if (error) {
      console.error('Error deleting reminder:', error);
      return;
    }

    setReminders(reminders.filter(r => r.id !== reminderId));
  }

  // Filter reminders
  const filteredReminders = reminders.filter(reminder => {
    // Filter by status
    if (filter === 'pending' && reminder.completed) return false;
    if (filter === 'completed' && !reminder.completed) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        reminder.title.toLowerCase().includes(query) ||
        reminder.description?.toLowerCase().includes(query) ||
        reminder.person_name?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Group reminders by date
  const groupedReminders = filteredReminders.reduce((groups, reminder) => {
    const date = reminder.due_date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(reminder);
    return groups;
  }, {} as Record<string, Reminder[]>);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) return 'Today';
    if (date.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (date < today) return 'Overdue';
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-400';
      case 'low': return 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-600 dark:text-gray-400">Loading reminders...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Reminders
            </h1>
            <Link href="/reminders/new">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                <Plus className="h-5 w-5" />
                New Reminder
              </button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search reminders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         placeholder-gray-500 dark:placeholder-gray-400
                         focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reminders List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No reminders
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchQuery 
                ? 'No reminders match your search'
                : filter === 'completed'
                ? "You haven't completed any reminders yet"
                : 'Create your first reminder to get started'}
            </p>
            {!searchQuery && filter === 'pending' && (
              <Link href="/reminders/new">
                <button className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                  Create Reminder
                </button>
              </Link>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {Object.entries(groupedReminders).map(([date, dateReminders]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {formatDate(date)}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Reminders for this date */}
                <div className="space-y-3">
                  {dateReminders.map((reminder) => (
                    <div
                      key={reminder.id}
                      className={`bg-white dark:bg-gray-800 rounded-lg border-2 transition-all
                                ${reminder.completed 
                                  ? 'border-gray-200 dark:border-gray-700 opacity-60' 
                                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                                }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleComplete(reminder.id, reminder.completed)}
                            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                      ${reminder.completed
                                        ? 'bg-green-500 border-green-500'
                                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-400'
                                      }`}
                          >
                            {reminder.completed && (
                              <Check className="h-4 w-4 text-white" />
                            )}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <h3 className={`text-base font-semibold mb-1 ${
                                  reminder.completed 
                                    ? 'text-gray-500 dark:text-gray-500 line-through' 
                                    : 'text-gray-900 dark:text-white'
                                }`}>
                                  {reminder.title}
                                </h3>
                                
                                {reminder.description && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {reminder.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-3 text-sm">
                                  {/* Time */}
                                  {reminder.due_time && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <Clock className="h-4 w-4" />
                                      <span>{reminder.due_time}</span>
                                    </div>
                                  )}

                                  {/* Person */}
                                  {reminder.person_name && (
                                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                      <User className="h-4 w-4" />
                                      <span>{reminder.person_name}</span>
                                    </div>
                                  )}

                                  {/* Priority */}
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(reminder.priority)}`}>
                                    {reminder.priority}
                                  </span>
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Link href={`/reminders/${reminder.id}/edit`}>
                                  <button className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                                    <Edit className="h-4 w-4" />
                                  </button>
                                </Link>
                                <button
                                  onClick={() => deleteReminder(reminder.id)}
                                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}




