import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { MoreHorizontal } from 'lucide-react';

interface DropdownItem {
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'destructive';
}

interface DropdownProps {
  items: DropdownItem[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ items, trigger, align = 'right' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger || (
          <button className="p-2 rounded-lg hover:bg-surface text-foreground/30 hover:text-foreground transition-all duration-200 active:scale-90">
            <MoreHorizontal size={18} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className={cn(
          "absolute z-50 mt-2 w-48 rounded-xl bg-surface/90 backdrop-blur-xl border border-border/40 shadow-2xl animate-in fade-in zoom-in duration-200 origin-top",
          align === 'right' ? "right-0" : "left-0"
        )}>
          <div className="py-1.5 px-1.5 space-y-0.5">
            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2.5 w-full px-3 py-2 text-xs font-bold rounded-lg transition-all duration-150",
                  item.variant === 'destructive' 
                    ? "text-destructive hover:bg-destructive/10" 
                    : "text-foreground/60 hover:bg-primary/10 hover:text-primary"
                )}
              >
                {item.icon && <item.icon size={14} className="shrink-0" />}
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
