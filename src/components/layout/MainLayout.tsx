// Layout principal de la aplicación - Modern Dark Theme
import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface MainLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  isAdmin?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title, subtitle, isAdmin = false }) => {
  return (
    <div className="flex min-h-screen bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <Header title={title} subtitle={subtitle} /> {/* Includes Bell Notification */}
        <main className="flex-1 p-6 overflow-auto bg-[var(--color-bg-primary)]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;