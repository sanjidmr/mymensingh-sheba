'use client';

import { useId, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  ariaLabel?: string;
}

export function Tabs({
  tabs,
  value,
  defaultValue,
  onValueChange,
  className,
  ariaLabel = 'বিভাগ',
}: TabsProps) {
  const id = useId();
  const enabledTabs = tabs.filter((tab) => !tab.disabled);
  const firstEnabled = enabledTabs[0]?.id ?? '';
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? firstEnabled);
  const selectedValue = value ?? uncontrolledValue;
  const selectedTab = tabs.find((tab) => tab.id === selectedValue && !tab.disabled) ?? enabledTabs[0];

  const selectTab = (nextValue: string) => {
    if (value === undefined) setUncontrolledValue(nextValue);
    onValueChange?.(nextValue);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const currentIndex = enabledTabs.findIndex((tab) => tab.id === event.currentTarget.dataset.tabId);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % enabledTabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + enabledTabs.length) % enabledTabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = enabledTabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = enabledTabs[nextIndex];
    if (!nextTab) return;
    selectTab(nextTab.id);
    document.getElementById(`${id}-tab-${nextTab.id}`)?.focus();
  };

  return (
    <div className={cn('min-w-0', className)}>
      <div role="tablist" aria-label={ariaLabel} className="flex min-w-0 gap-1 overflow-x-auto border-b border-[var(--ui-border)]">
        {tabs.map((tab) => {
          const selected = selectedTab?.id === tab.id;
          return (
            <button
              key={tab.id}
              id={`${id}-tab-${tab.id}`}
              type="button"
              role="tab"
              data-tab-id={tab.id}
              aria-selected={selected}
              aria-controls={`${id}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={tab.disabled}
              onClick={() => selectTab(tab.id)}
              onKeyDown={handleKeyDown}
              className={`ui-pressable min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition-colors ${
                selected
                  ? 'border-brand-700 text-brand-800'
                  : 'border-transparent text-text-muted hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {selectedTab && (
        <div
          id={`${id}-panel-${selectedTab.id}`}
          role="tabpanel"
          aria-labelledby={`${id}-tab-${selectedTab.id}`}
          tabIndex={0}
          className="pt-4 outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
        >
          {selectedTab.content}
        </div>
      )}
    </div>
  );
}
