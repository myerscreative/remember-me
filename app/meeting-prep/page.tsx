import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { MeetingPrepContent } from '@/components/meeting-prep/MeetingPrepContent';
import { getCurrentSession } from '@/lib/auth/session';

export default async function MeetingPrepPage() {
  const session = await getCurrentSession();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                📅 Meeting Prep
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Prepare for upcoming meetings with context and conversation starters
              </p>
            </div>
            
            {session && (
              <div className="flex items-center gap-3">
                <GoogleSignInButton />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!session ? (
          /* Not Signed In State */
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <div className="max-w-2xl mx-auto">
              <div className="w-24 h-24 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Connect Your Calendar
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Connect your Google Calendar to automatically prepare for upcoming meetings. 
                We&apos;ll surface relevant context, conversation starters, and mutual connections.
              </p>
              
              <div className="flex justify-center">
                <GoogleSignInButton />
              </div>
              
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-2xl mb-2">📖</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">The Story</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    See where you met, what you talked about, and why they matter
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-2xl mb-2">💬</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Conversation Starters</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    AI-generated questions based on what matters to them
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-2xl mb-2">🤝</div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Mutual Connections</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Discover who else you should connect them with
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <MeetingPrepContent />
        )}
      </div>
    </div>
  );
}
