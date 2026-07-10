'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface AccordionProps {
  title: string;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  countLabel?: string;
}

export function Accordion({ title, count, children, defaultOpen = false, countLabel = 'Mitra' }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-slate-450 font-semibold uppercase">{title}</span>
          <span className="text-[10px] text-slate-400 font-semibold">({count} {countLabel})</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {isOpen && (
        <div className="p-3 space-y-1.5">
          {children}
        </div>
      )}
    </div>
  );
}
