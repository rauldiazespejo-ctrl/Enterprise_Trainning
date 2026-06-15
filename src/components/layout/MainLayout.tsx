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
    <div className="flex min-h-screen" style={{ background: '#0a0d14' }}>
      {/* Sidebar — fixed width matches sidebar-root w-64 */}
      <div className="hidden lg:flex lg:shrink-0">
        <Sidebar isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;