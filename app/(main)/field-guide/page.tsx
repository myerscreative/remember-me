import { BookOpen, Map, Brain, Download, ChevronDown, ArrowLeft, Heart } from "lucide-react";
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

        <div className="prose prose-invert prose-indigo mx-auto prose-headings:font-bold prose-h2:flex prose-h2:items-center prose-h2:gap-3 prose-h2:mt-12 prose-h2:mb-6 prose-p:text-text-tertiary prose-p:leading-relaxed prose-li:text-text-tertiary">
          
          <h2 id="manifesto">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <BookOpen className="text-indigo-400 size-6" />
            </div>
            The Manifesto
          </h2>
          <p>
            Intention over Automation. We never send fake messages for you.
          </p>

          <h2 id="garden-map">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Map className="text-emerald-400 size-6" />
            </div>
            The Garden Map
          </h2>
          <p>
            The closer to the center, the more nurtured the friend. The outer red zone is for neglected seeds.
          </p>

          <h2 id="brain-dump">
            <div className="p-2 bg-purple-500/10 rounded-xl">
              <Brain className="text-purple-400 size-6" />
            </div>
            The Brain Dump
          </h2>
          <p>
            Record voice notes after hangouts to capture &quot;Deep Lore&quot; and update their story.
          </p>

          <h2 id="import">
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Download className="text-blue-400 size-6" />
            </div>
            The Import
          </h2>
          <p>
            Export iPhone contacts to a .vcf file and upload them in the Network tab.
          </p>
          
          <details className="not-prose mt-6 mb-8 w-full bg-canvas border border-border-default rounded-2xl overflow-hidden group">
            <summary className="px-6 py-4 hover:bg-elevated/50 transition-colors cursor-pointer list-none flex justify-between items-center outline-none">
              <span className="font-semibold text-text-secondary">View 3-Step Export Process</span>
              <ChevronDown className="size-5 text-text-tertiary group-open:rotate-180 transition-transform" />
            </summary>
            <div className="px-6 pb-6 pt-2 text-text-tertiary space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center size-6 rounded-full bg-elevated text-text-tertiary font-bold text-xs shrink-0 mt-0.5">1</div>
                <p>Open the Contacts App on your iPhone, go to <strong>Lists</strong>, long-press <strong>All Contacts</strong>, and select <strong>Export</strong>.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center size-6 rounded-full bg-elevated text-text-tertiary font-bold text-xs shrink-0 mt-0.5">2</div>
                <p>Save the generated <strong>.vcf</strong> file directly to your phone&apos;s files.</p>
              </div>
              <div className="flex gap-4 items-start">
                <div className="flex items-center justify-center size-6 rounded-full bg-elevated text-text-tertiary font-bold text-xs shrink-0 mt-0.5">3</div>
                <p>Upload that file in the <strong>Network</strong> tab of this app to successfully import your seeds.</p>
              </div>
            </div>
          </details>

          <h2 id="health-score">
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Heart className="text-amber-400 size-6" />
            </div>
            Relationship Health Score
          </h2>
          <p>
            This score shows how nurtured this connection is. It drifts lower over time if you don&apos;t stay in touch. Use the Brain Dump to boost it!
          </p>
          
        </div>

        <div className="mt-16 space-y-4 flex flex-col items-center">
          <Link href="/garden">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl px-8 w-full sm:w-auto shadow-lg shadow-indigo-900/40">
              Go to My Garden
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" size="lg" className="rounded-xl px-8 w-full sm:w-auto border-border-default text-text-tertiary hover:bg-elevated hover:text-text-primary">
              <ArrowLeft className="size-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
