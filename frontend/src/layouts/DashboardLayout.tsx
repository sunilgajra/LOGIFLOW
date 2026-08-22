import React, { useState } from 'react';
import { Outlet, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Truck, UploadCloud, Settings, Bell, Search, 
  LogOut, FileText, MapPin, ShieldAlert, Menu, X, BarChart3, UserCheck, Calendar, Building2, Package, MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Delivery Staff / Driver RBAC Guard: Restrict OPERATIONS role strictly to Delivery Mode (E-POD)
  if (user?.role === 'OPERATIONS' && location.pathname !== '/dashboard/delivery') {
    return <Navigate to="/dashboard/delivery" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const allNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ACCOUNTS', 'VIEWER'] },
    { name: 'Shipments', href: '/dashboard/shipments', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ACCOUNTS', 'VIEWER'] },
    { name: 'Pickup Requests', href: '/dashboard/pickups', icon: Package, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ACCOUNTS', 'VIEWER'] },
    { name: 'Dock Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ACCOUNTS', 'VIEWER'] },
    { name: 'Support / Tickets', href: '/dashboard/support', icon: MessageSquare, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ACCOUNTS', 'VIEWER'] },
    { name: 'Monthly Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT', 'ACCOUNTS'] },
    { name: 'NDR Action Desk', href: '/dashboard/ndr', icon: ShieldAlert, roles: ['SUPER_ADMIN', 'ADMIN', 'CLIENT'] },
    { name: 'Billing / Invoices', href: `/dashboard/clients/${user?.client_id}`, icon: FileText, roles: ['CLIENT'] },
    { name: 'Delivery Mode (E-POD)', href: '/dashboard/delivery', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS'] },
    { name: 'Import Delivery Sheets', href: '/dashboard/import', icon: UploadCloud, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Clients', href: '/dashboard/clients', icon: Users, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
    { name: 'Team Users', href: '/dashboard/users', icon: UserCheck, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Couriers', href: '/dashboard/couriers', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Rate Cards', href: '/dashboard/rates', icon: FileText, roles: ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTS'] },
    { name: 'Zone Mapping', href: '/dashboard/zones', icon: MapPin, roles: ['SUPER_ADMIN', 'ADMIN'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
  ];

  const navigation = allNavigation.filter(item => item.roles.includes(user?.role || ''));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Desktop Permanent Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-slate-900 text-white flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link to="/" className="text-xl font-bold text-blue-400">LogiFlow</Link>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/dashboard');
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                {user?.first_name?.charAt(0) || 'U'}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs text-slate-400">{user?.role === 'OPERATIONS' ? 'Driver' : user?.role === 'CLIENT' ? 'Client' : 'Admin'}</p>
              </div>
            </div>
            <button onClick={handleLogout} className="text-slate-400 hover:text-white" title="Logout">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Slide-over Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" 
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <aside className="relative w-72 bg-slate-900 text-white flex flex-col h-full shadow-2xl z-10">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
              <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-xl font-bold text-blue-400">LogiFlow</Link>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href || (location.pathname.startsWith(item.href) && item.href !== '/dashboard');
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-600 text-white' 
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                    {user?.first_name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                    <p className="text-xs text-slate-400">{user?.role === 'OPERATIONS' ? 'Driver' : user?.role === 'CLIENT' ? 'Client' : 'Admin'}</p>
                  </div>
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-white" title="Logout">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 z-10">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Hamburger Button for Mobile */}
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <span className="md:hidden text-lg font-bold text-blue-600 tracking-tight">LogiFlow</span>

            {user?.role !== 'OPERATIONS' && (
              <div className="relative w-full max-w-md hidden sm:block">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-slate-400" />
                </div>
                <input 
                  type="text" 
                  placeholder="Search shipments by AWB, Client..." 
                  className="block w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-colors"
                />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <button className="p-2 text-slate-400 hover:text-slate-500 relative">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
