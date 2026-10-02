'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LinksPageHeaderProps {
  onOpenCreate: () => void;
  totalCount: number;
}

export function LinksPageHeader({ onOpenCreate, totalCount }: LinksPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#1A2621]">
            My Links
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EBF5F1] text-[#236B56]">
            {totalCount} total
          </span>
        </div>
        <p className="text-xs text-[#61726A] mt-1">
          Create, edit, analyze, and manage all your shortened destinations
        </p>
      </div>

      <Button
        onClick={onOpenCreate}
        variant="primary"
        size="md"
        className="gap-2 font-semibold text-xs shadow-sm bg-[#236B56] hover:bg-[#1C5745] self-start sm:self-auto"
      >
        <Plus className="w-4 h-4" />
        <span>Create Link</span>
      </Button>
    </div>
  );
}
