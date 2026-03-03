import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Topbar from './components/Topbar';

import Dashboard from './pages/Dashboard';
import OrdersBeton from './pages/OrdersBeton';
import OrdersZbi from './pages/OrdersZbi';
import Clients from './pages/Clients';
import Weighings from './pages/Weighings';
import Production from './pages/Production';
import Warehouse from './pages/Warehouse';
import Logistics from './pages/Logistics';
import Maintenance from './pages/Maintenance';
import Quality from './pages/Quality';
import OrdersUnified from './pages/OrdersUnified';
import OrderCard from './pages/OrderCard';
import ClientCard from './pages/ClientCard';
import DebtScreen from './pages/DebtScreen';
import WeighingCard from './pages/WeighingCard';
import RBUShift from './pages/RBUShift';
import FormingPlan from './pages/FormingPlan';
import BIReports from './pages/BIReports';
import CementSilos from './pages/CementSilos';
import RepairRequests from './pages/RepairRequests';

const navItems = [
  { to: '/', label: 'Оперативный дашборд', icon: '📊' },
  { to: '/orders', label: 'Заказы и отгрузки', icon: '🧾' },
  { to: '/weighings', label: 'Весовая (1С Весы)', icon: '⚖️' },
  { to: '/rbu-shift', label: 'РБУ (замесы/рецепты)', icon: '🏭' },
  { to: '/forming-plan', label: 'ЖБИ производство', icon: '🧱' },
  { to: '/warehouse', label: 'Склад металла', icon: '🔩' },
  { to: '/quality', label: 'Лаборатория/качество', icon: '🧪' },
  { to: '/debt', label: 'Финансы/ДЗ', icon: '💰' },
  { to: '/bi', label: 'BI отчёты', icon: '📈' },
  { to: '/clients', label: 'Клиенты', icon: '👥' },
  { to: '/production', label: 'Производство', icon: '⚙️' },
  { to: '/logistics', label: 'Логистика', icon: '🚚' },
  { to: '/maintenance', label: 'ТОиР', icon: '🔧' },
  { to: '/repair-requests', label: 'Заявки на ремонт', icon: '📋' },
  { to: '/cement-silos', label: 'Силосы цемента', icon: '🏗️' },
];

function App() {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 10));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);
  return (
    <ThemeProvider>
    <AuthProvider>
    <BrowserRouter>
      <div className="app">
        <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} aria-hidden="true" />
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} aria-label="Сайдбар">
          <div className="sidebar-brand">
            <div className="name">Түндүк-Бетон</div>
          </div>
          <nav className="sidebar-nav" aria-label="Навигация">
            {navItems.map(({ to, label, icon }) => (
              <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => isActive ? 'active' : ''} onClick={closeSidebar}>
                <span className="nav-ico">{icon}</span>
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="app-content">
          <Topbar period={period} onPeriodChange={setPeriod} onMenuClick={() => setSidebarOpen(true)} />
          <main className="main">
            <div className="main-inner">
              <Routes>
                <Route path="/" element={<Dashboard period={period} />} />
                <Route path="/orders" element={<OrdersUnified />} />
                <Route path="/order/:type/:id" element={<OrderCard />} />
                <Route path="/orders-beton" element={<OrdersBeton />} />
                <Route path="/orders-zbi" element={<OrdersZbi />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/clients/:id" element={<ClientCard />} />
                <Route path="/weighings/:id" element={<WeighingCard />} />
                <Route path="/weighings" element={<Weighings />} />
                <Route path="/production" element={<Production />} />
                <Route path="/warehouse" element={<Warehouse />} />
                <Route path="/logistics" element={<Logistics />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/repair-requests" element={<RepairRequests />} />
                <Route path="/quality" element={<Quality />} />
                <Route path="/debt" element={<DebtScreen />} />
                <Route path="/bi" element={<BIReports />} />
                <Route path="/cement-silos" element={<CementSilos />} />
                <Route path="/rbu-shift" element={<RBUShift />} />
                <Route path="/forming-plan" element={<FormingPlan />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
