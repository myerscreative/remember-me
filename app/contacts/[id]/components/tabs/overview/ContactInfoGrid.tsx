'use client';

import { Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactInfoGridProps {
  email?: string | null;
  phone?: string | null;
}

export function ContactInfoGrid({ email, phone }: ContactInfoGridProps) {
  return (
    <section className="bg-card border border-border rounded-2xl p-6 shadow-sm">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
        Contact Information
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {/* Email */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Email
            </p>
            <p className={cn(
              "text-sm truncate",
              email ? "text-foreground font-medium" : "text-muted-foreground italic"
            )}>
              {email || "No email"}
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
              Phone
            </p>
            <p className={cn(
              "text-sm",
              phone ? "text-foreground font-medium" : "text-muted-foreground italic"
            )}>
              {phone || "No phone"}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
