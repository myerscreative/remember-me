'use client';

import { Users, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConnectionsNoticeProps {
  connectionCount: number;
  onLinkConnection: () => void;
}

export function ConnectionsNotice({ connectionCount, onLinkConnection }: ConnectionsNoticeProps) {
  const isEmpty = connectionCount === 0;

  return (
    <section className="bg-card border border-border rounded-2xl p-5 shadow-sm text-center">
      <p className="text-sm text-muted-foreground mb-3">
        {isEmpty ? 'No connections yet' : `Connected to ${connectionCount} ${connectionCount === 1 ? 'person' : 'people'}`}
      </p>
      <Button
        variant="outline"
        size="sm"
        onClick={onLinkConnection}
        className="text-xs font-medium inline-flex items-center gap-2"
      >
        <LinkIcon className="w-3.5 h-3.5" />
        {isEmpty ? 'Link a Connection' : 'View Connections'}
      </Button>
    </section>
  );
}
