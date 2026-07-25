import React from 'react';
import { Header } from '../common/Header';
import { Footer } from '../common/Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white w-full max-w-full overflow-x-hidden">
      <Header />
      <main className="flex-1 w-full max-w-full px-4 sm:px-6 lg:px-8 py-5">
        {children}
      </main>
      <Footer />
    </div>
  );
};
