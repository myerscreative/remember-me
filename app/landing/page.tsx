import Link from 'next/link';
import { ArrowRight, Users, Brain, Calendar, Sparkles, Heart, MessageSquare } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-zinc-900">ReMember Me</span>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                href="/login" 
                className="text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/signup" 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full mb-6 border border-blue-100">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Never forget the people who matter</span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-zinc-900 mb-6 leading-tight">
              Remember Everyone,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Effortlessly
              </span>
            </h1>
            
            <p className="text-xl text-zinc-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your personal relationship intelligence app. Track conversations, remember important details, 
              and maintain meaningful connections with the people in your life.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/signup" 
                className="group px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer flex items-center gap-2 text-lg font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="px-8 py-4 bg-white text-zinc-900 rounded-xl hover:bg-zinc-50 transition-colors border-2 border-zinc-200 text-lg font-semibold cursor-pointer">
                Watch Demo
              </button>
            </div>
            
            <p className="text-sm text-zinc-500 mt-6">
              Free forever • No credit card required • 2 minutes to set up
            </p>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">
              We all struggle to remember
            </h2>
            <p className="text-xl text-zinc-300 leading-relaxed">
              You meet someone at a conference. Have a great conversation. Exchange contacts. 
              Three months later, they reach out... and you can't remember a single thing about them. 
              <span className="text-white font-semibold"> Sound familiar?</span>
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-4">
              Your relationship superpower
            </h2>
            <p className="text-xl text-zinc-600 max-w-2xl mx-auto">
              ReMember Me helps you track, remember, and nurture every important connection
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-8 bg-white rounded-2xl border-2 border-zinc-200 hover:border-blue-600 transition-all cursor-pointer hover:shadow-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Brain className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">AI-Powered Context</h3>
              <p className="text-zinc-600 leading-relaxed">
                Speak naturally and let AI capture everything. No more manual note-taking or forgotten details.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 bg-white rounded-2xl border-2 border-zinc-200 hover:border-blue-600 transition-all cursor-pointer hover:shadow-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Calendar className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Meeting Prep Mode</h3>
              <p className="text-zinc-600 leading-relaxed">
                Get instant context before every meeting. Know exactly who you're talking to and what matters to them.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 bg-white rounded-2xl border-2 border-zinc-200 hover:border-blue-600 transition-all cursor-pointer hover:shadow-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Users className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Instant Import</h3>
              <p className="text-zinc-600 leading-relaxed">
                Import 200+ contacts in 30 seconds. Start with value on day one, not an empty app.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 bg-white rounded-2xl border-2 border-zinc-200 hover:border-blue-600 transition-all cursor-pointer hover:shadow-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <MessageSquare className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Voice Memos</h3>
              <p className="text-zinc-600 leading-relaxed">
                Capture thoughts in seconds with floating voice button. AI transcribes and organizes everything.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 bg-white rounded-2xl border-2 border-zinc-200 hover:border-blue-600 transition-all cursor-pointer hover:shadow-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Sparkles className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Smart Summaries</h3>
              <p className="text-zinc-600 leading-relaxed">
                AI generates one-sentence summaries of every relationship. Quick context when you need it.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 bg-white rounded-2xl border-2 border-zinc-200 hover:border-blue-600 transition-all cursor-pointer hover:shadow-xl">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                <Heart className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-zinc-900 mb-3">Relationship Garden</h3>
              <p className="text-zinc-600 leading-relaxed">
                Visualize your network. See who needs attention and nurture connections that matter.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-zinc-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">
              Loved by relationship builders
            </h2>
            <p className="text-xl text-zinc-600">
              Join thousands who never forget a connection
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-700 mb-6 leading-relaxed">
                "Game changer for my networking. I used to forget people's names 5 minutes after meeting them. 
                Now I remember everyone and their stories."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Sarah Mitchell</p>
                  <p className="text-sm text-zinc-600">Sales Director</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-700 mb-6 leading-relaxed">
                "The voice memo feature is brilliant. I can capture thoughts right after a meeting while they're fresh. 
                AI does the rest."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold">
                  JC
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">James Chen</p>
                  <p className="text-sm text-zinc-600">Entrepreneur</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                ))}
              </div>
              <p className="text-zinc-700 mb-6 leading-relaxed">
                "Finally, an app that actually helps me maintain relationships. The meeting prep mode saves me 
                hours of scrolling through old messages."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                  EP
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">Emily Parker</p>
                  <p className="text-sm text-zinc-600">Product Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 mb-6">
            Ready to remember everyone?
          </h2>
          <p className="text-xl text-zinc-600 mb-8">
            Join thousands building stronger relationships. Start free in 2 minutes.
          </p>
          <Link 
            href="/signup" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all cursor-pointer text-lg font-semibold shadow-lg shadow-blue-600/20 hover:shadow-xl hover:shadow-blue-600/30 group"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-sm text-zinc-500 mt-4">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-zinc-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-blue-400" />
                <span className="text-xl font-bold">ReMember Me</span>
              </div>
              <p className="text-zinc-400 text-sm">
                Your personal relationship intelligence app
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-zinc-800 text-center text-sm text-zinc-400">
            <p>© 2026 ReMember Me. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
