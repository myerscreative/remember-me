"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ErrorFallback } from "@/components/error-fallback";
import { 
  Bell, 
  Plus, 
  Check, 
  Clock, 
  Calendar,
  User,
  Trash2,
  Edit,
  Search,
  X
} from "lucide-react";
import { format } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";

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
  const [error, setError] = useState<Error | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit modal state
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    due_date: '',
    due_time: '',
    priority: 'medium' as 'low' | 'medium' | 'high'
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadReminders();
  }, []);

  async function loadReminders() {
    // Reset states
    setLoading(true);
    setError(null);
    
    const supabase = createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      // Fetch reminders with person information
      const { data: remindersData, error } = await (supabase as any)
        .from('reminders')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true })
        .order('due_time', { ascending: true });

      if (error) throw error;

      // No person join; use reminders data directly
      const transformedReminders = remindersData || [];

      setReminders(transformedReminders);
    } catch (error) {
      console.error('Error loading reminders:', error);
      if ((error as any)?.message) console.error('Error message:', (error as any).message);
      if ((error as any)?.details) console.error('Error details:', (error as any).details);
      if ((error as any)?.hint) console.error('Error hint:', (error as any).hint);

      // No fallback needed as we are already fetching simple reminders.
    } finally {
      setLoading(false);
    }
  }

  async function toggleComplete(reminderId: string, currentStatus: boolean) {
    const supabase = createClient();
    
    const { error } = await (supabase as any)
      .from('reminders')
      .update({ completed: !currentStatus })
      .eq('id', reminderId);

    if (error) {
      console.error('Error updating reminder:', error);
      return;
    }

    // Update local state
    setReminders((reminders as any[]).map((r: any) => 
      r.id === reminderId ? { ...r, completed: !currentStatus } : r
    ));
  }

  async function deleteReminder(reminderId: string) {
    if (!confirm('Are you sure you want to delete this reminder?')) return;

    const supabase = createClient();
    
    const { error } = await (supabase as any)
      .from('reminders')
      .delete()
      .eq('id', reminderId);

    if (error) {
      console.error('Error deleting reminder:', error);
      return;
    }

    setReminders((reminders as any[]).filter((r: any) => r.id !== reminderId));
  }

  function openEditModal(reminder: Reminder) {
    setEditingReminder(reminder);
    setEditForm({
      title: reminder.title,
      description: reminder.description || '',
      due_date: reminder.due_date,
      due_time: reminder.due_time || '',
      priority: reminder.priority
    });
  }

  async function updateReminder() {
    if (!editingReminder || !editForm.title.trim() || !editForm.due_date) return;
    
    setSaving(true);
    const supabase = createClient();
    
    const { error } = await (supabase as any)
      .from('reminders')
      .update({
        title: editForm.title.trim(),
        description: editForm.description.trim() || null,
        due_date: editForm.due_date,
        due_time: editForm.due_time || null,
        priority: editForm.priority
      })
      .eq('id', editingReminder.id);

    setSaving(false);

    if (error) {
      console.error('Error updating reminder:', error);
      alert('Failed to update reminder');
      return;
    }

    // Update local state
    setReminders((reminders as any[]).map((r: any) => 
      r.id === editingReminder.id 
        ? { 
            ...r, 
            title: editForm.title.trim(),
            description: editForm.description.trim() || null,
            due_date: editForm.due_date,
            due_time: editForm.due_time || null,
            priority: editForm.priority
          } 
        : r
    ));
    
    setEditingReminder(null);
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

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <ErrorFallback
          error={error}
          reset={loadReminders}
          title="Reminders unavailable"
          message="We couldn't load your reminders. Please try again."
        />
      </div>
    );
  }

  return (
    <>
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
                className={
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                All
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'pending'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={
                  `px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    filter === 'completed'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`
                }
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
                            className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
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
                                <button
                                  onClick={() => openEditModal(reminder)}
                                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
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

      {/* Edit Modal */}
      {editingReminder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Reminder</h2>
              <button
                onClick={() => setEditingReminder(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title *
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Reminder title"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date *
                  </label>
                  <DatePicker
                    date={
                      editForm.due_date
                        ? (() => {
                            const [y, m, d] = editForm.due_date.split('-').map(Number);
                            return new Date(y, m - 1, d);
                          })()
                        : undefined
                    }
                    setDate={(date) =>
                      setEditForm({
                        ...editForm,
                        due_date: date ? format(date, "yyyy-MM-dd") : "",
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={editForm.due_time}
                    onChange={(e) => setEditForm({ ...editForm, due_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
                             bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                             focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priority
                </label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, priority: p })}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        editForm.priority === p
                          ? p === 'high' ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-400'
                          : p === 'medium' ? 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-400'
                          : 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400'
                          : 'bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                      }`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditingReminder(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateReminder}
                disabled={saving || !editForm.title.trim() || !editForm.due_date}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}







