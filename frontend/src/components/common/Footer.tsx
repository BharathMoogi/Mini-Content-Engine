import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 py-4 mt-auto w-full max-w-full">
      <div className="w-full max-w-full px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Mini Content Engine. Full-stack modular application foundation.</p>
      </div>
    </footer>
  );
};
