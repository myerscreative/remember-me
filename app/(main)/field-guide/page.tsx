import { BookOpen, Map, Brain, Download, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function FieldGuidePage() {
  return (
    <div className="flex-1 overflow-y-auto pb-safe">
      <div className="mx-auto max-w-3xl px-6 py-12 md:py-16">
        <header className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground mb-4">
            The Field Guide
          </h1>
          <p className="text-xl text-muted-foreground font-medium">
            How to Grow Your Garden
          </p>
        </header>

        <div className="prose prose-invert prose-indigo mx-auto prose-headings:font-bold prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-h2:mt-12 prose-h2:mb-6 prose-p:text-slate-300 prose-p:leading-relaxed prose-li:text-slate-300">
          
          <h2 id="intention">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <BookOpen className="text-indigo-400 size-6" />
            </div>
            Chapter 1: The Philosophy (Intention over Automation)
          </h2>
          <p>
            Most apps try to replace your effort with &quot;auto-replies.&quot; We believe that kills the soul of a friendship. ReMember Me never sends messages for you. We provide the intention (the reminder), but you provide the action (the reach-out).
          </p>

          <h2 id="garden-map">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Map className="text-emerald-400 size-6" />
            </div>
            Chapter 2: The Garden Map (Visualizing the Drift)
          </h2>
          <p>
            The Center represents your Nurtured friends. As time passes without contact, friends move to the &quot;Drift&quot; (Orange) and eventually the &quot;Neglected&quot; (Red) zones. A red dot isn&apos;t a failure—it&apos;s an invitation to reconnect.
          </p>

          <h2 id="brain-dump">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Brain className="text-purple-400 size-6" />
            </div>
            Chapter 3: The Brain Dump & Synthesis
          </h2>
          <p>
            Don&apos;t just log a call; capture the &quot;Deep Lore.&quot; Use the Voice Brain Dump to mention specific details (like a pet&apos;s name or a big project). Hit &quot;Synthesize&quot; to let the AI automatically update their Story tab.
          </p>

          <h2 id="importing">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Download className="text-blue-400 size-6" />
            </div>
            Chapter 4: Importing Seeds (iPhone Guide)
          </h2>
          
          <details className="not-prose mt-6 mb-8 w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden group">
            <summary className="px-6 py-4 hover:bg-slate-800/50 transition-colors cursor-pointer list-none flex justify-between items-center outline-none">
              <span className="font-semibold text-slate-200">View 3-Step Export Process</span>
              <ChevronDown className="size-5 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-6 pb-6 pt-2 text-slate-400 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center size-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs shrink-0 mt-0.5">1</div>
                <p>Open the Contacts App on your iPhone, go to <strong>Lists</strong>, long-press <strong>All Contacts</strong>, and select <strong>Export</strong>.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center size-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs shrink-0 mt-0.5">2</div>
                <p>Save the generated <strong>.vcf</strong> file directly to your phone&apos;s files.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center size-6 rounded-full bg-slate-800 text-slate-300 font-bold text-xs shrink-0 mt-0.5">3</div>
                <p>Upload that file in the <strong>Network</strong> tab of this app to successfully import your seeds.</p>
              </div>
            </div>
          </details>
          
        </div>

        <div className="mt-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center max-w-xl mx-auto">
          <h3 className="text-xl font-bold text-slate-200 mb-2">Ready to start?</h3>
          <p className="text-slate-400 mb-6 text-sm">Now that you understand the plan, it&apos;s time to get your hands dirty.</p>
          <Link href="/garden">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-8 w-full sm:w-auto shadow-lg shadow-indigo-900/40">
              Go to My Garden
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
