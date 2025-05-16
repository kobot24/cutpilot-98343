
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

type SidebarItem = {
  id: string;
  title: string;
};

type SidebarProps = {
  onNavigate: (id: string) => void;
  activeSection: string;
};

const sidebarItems: SidebarItem[] = [
  { id: 'upload', title: 'Upload' },
  { id: 'files', title: 'Dateien & Konvertierung' },
  { id: 'settings', title: 'Einstellungen' },
  { id: 'printplate', title: 'Printplate-Erstellung' },
];

// This component is kept for backward compatibility but is no longer used directly.
// The main UI now uses AppSidebar.tsx instead.
export const Sidebar = ({ onNavigate, activeSection }: SidebarProps) => {
  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 h-screen p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-blue-600">PrintPlate</h1>
        <p className="text-sm text-gray-500">JPG zu PDF mit CutContour</p>
      </div>
      
      <nav className="space-y-1">
        {sidebarItems.map((item) => (
          <Button
            key={item.id}
            variant={activeSection === item.id ? "default" : "ghost"}
            className={cn(
              "w-full justify-start text-left font-normal",
              activeSection === item.id 
                ? "bg-blue-600 text-white" 
                : "text-gray-600 hover:text-blue-600 hover:bg-gray-100"
            )}
            onClick={() => onNavigate(item.id)}
          >
            {item.title}
          </Button>
        ))}
      </nav>
    </div>
  );
};
