import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FileText, UploadCloud, MessageSquare, Menu, LogOut } from 'lucide-react';
import logo from '../assets/logo.png';
import { useState } from 'react';

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || 'usuario@soldesp.com';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    navigate('/login');
  };

  const navigation = [
    { name: 'Procedimientos', href: '/procedures', icon: FileText },
    { name: 'Subir Documento', href: '/upload', icon: UploadCloud },
    { name: 'Chat AI Asistente', href: '/chat', icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-brand-navy transform transition-transform duration-300 lg:relative lg:translate-x-0 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-center h-20 px-6 bg-white border-b border-slate-200 shrink-0">
          <img src={logo} alt="SoldesP Logo" className="h-10 object-contain" />
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-brand-orange text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden pr-2">
              <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center text-brand-orange font-bold border border-slate-700 shrink-0">
                {userEmail.charAt(0).toUpperCase()}
              </div>
              <div className="truncate">
                <p className="text-sm font-medium text-white truncate">{userEmail.split('@')[0]}</p>
                <p className="text-xs text-slate-400 truncate">{userEmail}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors shrink-0">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 lg:hidden shrink-0">
          <div className="flex items-center justify-between px-4 h-16">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>
            <img src={logo} alt="SoldesP" className="h-8" />
            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
