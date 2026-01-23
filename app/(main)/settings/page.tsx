"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Network,
  Bell,
  Clock,
  Palette,
  Shield,
  ChevronRight,
  Save,
  Loader2,
  Database,
  Calendar,
  Users,
  Sun,
  Moon,
  Monitor
} from "lucide-react";
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { useTheme } from "@/app/providers/theme-provider";
import toast, { Toaster } from "react-hot-toast";
import { ErrorFallback } from "@/components/error-fallback";
import { cn } from "@/lib/utils";

interface UserSettings {
  // Profile
  display_name?: string;
  email?: string;

  // Network preferences
  default_network_view?: 'circular' | 'list';
  show_birthdays_on_network?: boolean;
  auto_favorite_new_contacts?: boolean;
  network_zoom_level?: number;

  // Notifications
  email_notifications?: boolean;
  birthday_reminders?: boolean;
  birthday_reminder_days?: number;
  contact_reminders?: boolean;

  // Reminders
  default_reminder_time?: string;
  reminder_frequency?: 'daily' | 'weekly' | 'monthly';
  quiet_hours_start?: string;
  quiet_hours_end?: string;

  // Display
  theme?: 'light' | 'dark' | 'auto';
  compact_mode?: boolean;
  show_last_contact?: boolean;

  // AI Summary
  summary_level_default?: 'micro' | 'default' | 'full';
}

export default function SettingsPage() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<UserSettings>({
    show_birthdays_on_network: true,
    auto_favorite_new_contacts: false,
    email_notifications: true,
    birthday_reminders: true,
    birthday_reminder_days: 7,
    contact_reminders: true,
    default_reminder_time: '09:00',
    reminder_frequency: 'weekly',
    compact_mode: false,
    show_last_contact: true,
    network_zoom_level: 100,
    summary_level_default: 'default',
  });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadSettings() {
      // Reset error state
      setError(null);
      
      try {
        const supabase = createClient();
        
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push('/login');
          return;
        }

        setUser(authUser);

        // Load user settings from database
        const { data: userSettings, error: settingsError } = await (supabase as any)
          .from('user_settings')
          .select('*')
          .eq('user_id', authUser.id)
          .single();
        
        if (settingsError && settingsError.code !== 'PGRST116') { 
          // If the table doesn't exist (42P01) or other DB error, don't crash the whole page
          // Just log it and proceed with default settings
          console.warn("User settings table might be missing or unreachable:", settingsError);
        } else if (userSettings) {
          setSettings(prev => ({ ...prev, ...userSettings }));
        }
      } catch (err: any) {
        console.error("Critical error in loadSettings:", err);
        // We still don't want to crash the page if possible
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const supabase = createClient();
      
      // Upsert user settings
      const { error } = await (supabase as any)
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-gray-900">
        <ErrorFallback
          error={error}
          reset={() => window.location.reload()}
          title="Settings unavailable"
          message="We couldn't load your settings."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      <Toaster position="top-center" />
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          
          {/* Profile Section */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={settings.display_name || ''}
                  onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </section>

          {/* Network Preferences */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Network className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Network</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Show Birthdays on Network
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Display birthday badges on contact nodes</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_birthdays_on_network}
                    onChange={(e) => setSettings({ ...settings, show_birthdays_on_network: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Auto-favorite New Contacts
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Automatically mark new contacts as favorites</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.auto_favorite_new_contacts}
                    onChange={(e) => setSettings({ ...settings, auto_favorite_new_contacts: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Zoom Level
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={settings.network_zoom_level}
                    onChange={(e) => setSettings({ ...settings, network_zoom_level: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[50px]">
                    {settings.network_zoom_level}%
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <Bell className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Email Notifications
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Receive notifications via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.email_notifications}
                    onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Birthday Reminders
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Get notified of upcoming birthdays</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.birthday_reminders}
                    onChange={(e) => setSettings({ ...settings, birthday_reminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.birthday_reminders && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notify me this many days before
                  </label>
                  <select
                    value={settings.birthday_reminder_days}
                    onChange={(e) => setSettings({ ...settings, birthday_reminder_days: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value={1}>1 day</option>
                    <option value={3}>3 days</option>
                    <option value={7}>7 days</option>
                    <option value={14}>14 days</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Contact Reminders
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Remind me to reach out to contacts</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.contact_reminders}
                    onChange={(e) => setSettings({ ...settings, contact_reminders: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* Reminders */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Reminders</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Reminder Time
                </label>
                <input
                  type="time"
                  value={settings.default_reminder_time}
                  onChange={(e) => setSettings({ ...settings, default_reminder_time: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Check-in Frequency
                </label>
                <select
                  value={settings.reminder_frequency}
                  onChange={(e) => setSettings({ ...settings, reminder_frequency: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">How often to suggest reaching out to contacts</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiet Hours Start
                  </label>
                  <input
                    type="time"
                    value={settings.quiet_hours_start || '22:00'}
                    onChange={(e) => setSettings({ ...settings, quiet_hours_start: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quiet Hours End
                  </label>
                  <input
                    type="time"
                    value={settings.quiet_hours_end || '08:00'}
                    onChange={(e) => setSettings({ ...settings, quiet_hours_end: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Display Options */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-pink-100 dark:bg-pink-900 rounded-lg">
                <Palette className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Display</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Theme
                </label>
                <div className="flex gap-2">
                  {/* Light Mode Button */}
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'light'
                        ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400'
                    }`}
                  >
                    <div className={cn("p-2 rounded-lg transition-colors", theme === 'light' ? "bg-purple-100 text-purple-600" : "bg-gray-100 dark:bg-gray-800")}>
                      <Sun className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-xs uppercase tracking-wider">Light</span>
                  </button>
                  
                  {/* Dark Mode Button */}
                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'dark'
                        ? 'border-purple-500 bg-[#1E293B] text-purple-400 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400'
                    }`}
                  >
                    <div className={cn("p-2 rounded-lg transition-colors", theme === 'dark' ? "bg-purple-900/40 text-purple-400" : "bg-gray-100 dark:bg-gray-800")}>
                      <Moon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-xs uppercase tracking-wider">Dark</span>
                  </button>
                  
                  {/* Auto Mode Button */}
                  <button
                    onClick={() => setTheme('auto')}
                    className={`flex-1 flex flex-col items-center justify-center gap-2 px-4 py-4 rounded-xl border-2 transition-all duration-200 ${
                      theme === 'auto'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400'
                    }`}
                  >
                    <div className={cn("p-2 rounded-lg transition-colors", theme === 'auto' ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300" : "bg-gray-100 dark:bg-gray-800")}>
                      <Monitor className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-xs uppercase tracking-wider">Auto</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Compact Mode
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Use denser spacing in lists</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.compact_mode}
                    onChange={(e) => setSettings({ ...settings, compact_mode: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    Show Last Contact Date
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Display when you last contacted someone</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.show_last_contact}
                    onChange={(e) => setSettings({ ...settings, show_last_contact: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </section>

          {/* AI Summary Preferences */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <span className="text-xl">✨</span>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">AI Summary Detail</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Choose how much detail you want to see</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Default Summary Level
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Changes take effect immediately. No new AI generation needed - all summaries are pre-cached.
                </p>
                <div className="flex gap-3">
                  {/* Quick (Micro) Button */}
                  <button
                    onClick={() => setSettings({ ...settings, summary_level_default: 'micro' })}
                    className={`flex-1 flex flex-col items-center justify-center gap-3 px-4 py-5 rounded-xl border-2 transition-all duration-200 ${
                      settings.summary_level_default === 'micro'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400'
                    }`}
                  >
                    <div className={cn("text-2xl")}>⚡</div>
                    <div className="text-center">
                      <div className="font-semibold text-sm uppercase tracking-wider mb-1">Quick</div>
                      <div className="text-[10px] opacity-80">15-25 words</div>
                    </div>
                  </button>

                  {/* Standard (Default) Button */}
                  <button
                    onClick={() => setSettings({ ...settings, summary_level_default: 'default' })}
                    className={`flex-1 flex flex-col items-center justify-center gap-3 px-4 py-5 rounded-xl border-2 transition-all duration-200 ${
                      settings.summary_level_default === 'default'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400'
                    }`}
                  >
                    <div className={cn("text-2xl")}>📝</div>
                    <div className="text-center">
                      <div className="font-semibold text-sm uppercase tracking-wider mb-1">Standard</div>
                      <div className="text-[10px] opacity-80">50-75 words</div>
                    </div>
                  </button>

                  {/* Detailed (Full) Button */}
                  <button
                    onClick={() => setSettings({ ...settings, summary_level_default: 'full' })}
                    className={`flex-1 flex flex-col items-center justify-center gap-3 px-4 py-5 rounded-xl border-2 transition-all duration-200 ${
                      settings.summary_level_default === 'full'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 shadow-sm ring-1 ring-purple-500/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400'
                    }`}
                  >
                    <div className={cn("text-2xl")}>📖</div>
                    <div className="text-center">
                      <div className="font-semibold text-sm uppercase tracking-wider mb-1">Detailed</div>
                      <div className="text-[10px] opacity-80">150-220 words</div>
                    </div>
                  </button>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Note:</strong> List views always show Quick summaries for fast scanning. Your preference applies to contact detail pages.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Setup & Imports */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                <Database className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Setup & Imports</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                    <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Calendar Sync</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Connect Google Calendar to track interactions</p>
                  </div>
                </div>
                <GoogleSignInButton />
              </div>

              <Link href="/import" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                    <Database className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Import Data</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Import contacts from CSV or vCard</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </Link>

              <Link href="/network/deduplicate" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
                    <Users className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">Merge Duplicates</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Find and merge duplicate contacts</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </Link>
            </div>
          </section>

          {/* Account Management */}
          <section className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Account</h2>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/change-password')}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">Change Password</span>
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </button>

              <button
                onClick={async () => {
                  if (confirm('Are you sure you want to sign out?')) {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    router.push('/login');
                  }
                }}
                className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">Sign Out</span>
                <ChevronRight className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              </button>

              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                    toast('Account deletion feature coming soon', { icon: 'ℹ️' });
                  }
                }}
                className="w-full px-4 py-3 border border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 font-medium"
              >
                Delete Account
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
