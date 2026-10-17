import React from 'react';
import { Menu, RotateCcw, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

interface NavbarProps {
  onMenuClick: () => void;
  title: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick, title }) => {
  const handleResetSeed = async () => {
    if (window.confirm('Reset demo database to original sample records?')) {
      try {
        await api.resetSeed();
        window.location.reload();
      } catch (err: any) {
        alert('Failed to reset seed data: ' + err.message);
      }
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 rounded-lg md:hidden hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
            Alexa+ Action-Oriented Productivity Agent
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Hackathon Mode Badge */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Alexa+ Track Demo</span>
        </div>

        {/* Reset Seed Button */}
        <button
          type="button"
          onClick={handleResetSeed}
          title="Reset database to realistic student sample records"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 transition-all border border-slate-200"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Reset Seed Data</span>
        </button>
      </div>
    </header>
  );
};
