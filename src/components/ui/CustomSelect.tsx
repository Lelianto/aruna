'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
  placeholder?: string;
}

export function CustomSelect({ options, value, onChange, label, className = '', placeholder = 'Pilih salah satu...' }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={`relative select-none ${className}`}>
      {label && (
        <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider block mb-1 select-none">
          {label}
        </span>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 bg-slate-55 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 text-left hover:bg-slate-100/50 focus:outline-none focus:ring-1 focus:ring-brand-navy/30 transition-all duration-150 cursor-pointer shadow-3xs"
      >
        <span className={selectedOption ? 'text-slate-800' : 'text-slate-400 font-medium'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1.5 animate-fade-slide-up">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-slate-400 italic">Tidak ada pilihan tersedia</div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-2 text-xs font-bold transition-colors block cursor-pointer ${
                    isSelected 
                      ? 'bg-brand-navy text-white' 
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-950'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
