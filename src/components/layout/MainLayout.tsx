import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isAdmin?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, subtitle, isAdmin = false }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMenu = useCallback(() => setMobileMenuOpen(v => !v), []);
  const closeMenu = useCallback(() => setMobileMenuOpen(false), []);

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0d14' }}>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeMenu} />
          <div className="relative w-64 h-full animate-slideIn">
            <Sidebar isAdmin={isAdmin} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} onMenuClick={toggleMenu} />
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;