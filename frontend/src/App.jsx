
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import Inventory from './pages/Inventory';
import Fruits from './pages/Fruits';
import Suppliers from './pages/Suppliers';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Payments from './pages/Payments';
import SellingPrices from './pages/SellingPrices';
import Reports from './pages/Reports';

import {
  LayoutDashboard,
  Package,
  Apple,
  Truck,
  Users,
  ShoppingBasket,
  ShoppingCart,
  Wallet,
  Tags,
  BarChart3,
  Bell,
  Search,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Menu,
  X,
  Leaf,
  Sprout,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  Activity,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

import {
  checkServerHealth,
  getBusinessReports
} from './services/api';

import './App.css';

const navigation = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Inventory', icon: Package },
  { name: 'Fruits', icon: Apple },
  { name: 'Suppliers', icon: Truck },
  { name: 'Vendors', icon: Users },
  { name: 'Purchases', icon: ShoppingBasket },
  { name: 'Sales', icon: ShoppingCart },
  { name: 'Payments', icon: Wallet },
  { name: 'Selling Prices', icon: Tags },
  { name: 'Reports', icon: BarChart3 }
];

const quickActions = [
  { label: 'New purchase', icon: ShoppingBasket, page: 'Purchases' },
  { label: 'Record sale', icon: ShoppingCart, page: 'Sales' },
  { label: 'Receive payment', icon: Wallet, page: 'Payments' },
  { label: 'Manage fruits', icon: Apple, page: 'Fruits' }
];

const formatMoney = (amount) => {
  const value = Number(amount || 0);
  return `M${value.toFixed(2)}`;
};

function App() {
  const [activePage, setActivePage] = useState('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [serverStatus, setServerStatus] = useState('checking');
  const [reportData, setReportData] = useState(null);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsError, setReportsError] = useState('');

  const loadDashboardData = async () => {
    setReportsLoading(true);
    setReportsError('');
    setServerStatus('checking');

    try {
      await checkServerHealth();

      const response = await getBusinessReports();

      setReportData(response.data);
      setServerStatus('connected');
    } catch (error) {
      console.error('Dashboard data error:', error);

      setServerStatus('disconnected');
      setReportsError(error.message || 'Unable to load dashboard reports.');
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const selectPage = (page) => {
    setActivePage(page);
    setSidebarOpen(false);
  };

  const pageDescription = {
    Inventory: 'Monitor available fruit stock and packaging quantities.',
    Fruits: 'Manage the fruits available in your farm distribution business.',
    Suppliers: 'Manage supplier information and supplier relationships.',
    Vendors: 'Manage your registered vendors and their contact information.',
    Purchases: 'Record purchases and monitor incoming stock.',
    Sales: 'Manage sales transactions and customer orders.',
    Payments: 'Track payments received and outstanding balances.',
    'Selling Prices': 'Manage selling prices for each fruit and package size.',
    Reports: 'Review business performance and operational reports.'
  };

  return (
    <div className="app-shell">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="mobile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <motion.aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
      >
        <div className="brand">
          <div className="brand-icon">
            <Sprout size={25} strokeWidth={2.1} />
          </div>

          <div className="brand-copy">
            <h1>BATLOUNG</h1>
            <span>FARM DISTRIBUTION</span>
          </div>

          <button
            className="sidebar-close icon-button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-section-label">WORKSPACE</div>

        <nav className="sidebar-navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activePage === item.name;

            return (
              <button
                key={item.name}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => selectPage(item.name)}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={19} strokeWidth={1.9} />
                <span>{item.name}</span>
                {isActive && <span className="active-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <div className="tip-icon">
              <Leaf size={18} />
            </div>

            <p>Growing better, distributing smarter.</p>
            <span>BATLOUNG FARM</span>
          </div>

          <div className="sidebar-footer">
            <span className="status-dot" />
            <span>System workspace</span>
            <span className="version">v1.0</span>
          </div>
        </div>
      </motion.aside>

      <main className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button mobile-menu-button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={17} />

              <input
                type="search"
                placeholder="Search workspace..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />

              <kbd>⌘ K</kbd>
            </div>

            <div className="notification-wrapper">
              <button
                className="icon-button notification-button"
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Notifications"
              >
                <Bell size={19} />
                <span className="notification-dot" />
              </button>

              <AnimatePresence>
                {notificationOpen && (
                  <motion.div
                    className="notification-popover"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    <strong>Notifications</strong>
                    <p>Your notification centre will appear here.</p>

                    <button onClick={() => setNotificationOpen(false)}>
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="profile-divider" />

            <button className="profile-button">
              <div className="profile-avatar">BF</div>

              <div className="profile-details">
                <strong>Farm Admin</strong>
                <span>Administrator</span>
              </div>

              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <div className="page-content">
          {activePage === 'Dashboard' ? (
            <Dashboard
              onNavigate={selectPage}
              reportData={reportData}
              loading={reportsLoading}
              error={reportsError}
              onRetry={loadDashboardData}
            />
          ) : activePage === 'Inventory' ? (
            <Inventory />
          ) : activePage === 'Fruits' ? (
            <Fruits />
          ) : activePage === 'Suppliers' ? (
            <Suppliers />
          ) : activePage === 'Vendors' ? (
            <Vendors />
          ) : activePage === 'Purchases' ? (
            <Purchases />
          ) : activePage === 'Sales' ? (
            <Sales />
          ) : activePage === 'Payments' ? (
            <Payments />
          ) : activePage === 'Selling Prices' ? (
            <SellingPrices />
          ) : activePage === 'Reports' ? (
            <Reports />
          ) : (
            <motion.section
              className="placeholder-page"
              key={activePage}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="page-heading">
                <div>
                  <span className="eyebrow">BATLOUNG FARM / WORKSPACE</span>
                  <h2>{activePage}</h2>
                  <p>{pageDescription[activePage]}</p>
                </div>

                <div className="heading-icon">
                  <ClipboardList size={25} />
                </div>
              </div>

              <div className="coming-soon-card">
                <div className="coming-soon-icon">
                  <Activity size={28} />
                </div>

                <h3>{activePage} workspace</h3>

                <p>
                  This section is part of the application structure.
                  We will connect it to the Batloung Farm API and build
                  its management features in the next stages.
                </p>

                <button
                  className="primary-button"
                  onClick={() => selectPage('Dashboard')}
                >
                  <LayoutDashboard size={17} />
                  Back to dashboard
                </button>
              </div>
            </motion.section>
          )}
        </div>

        {activePage === 'Dashboard' && (
          <div className="backend-status">
            <span
              className={`status-dot ${
                serverStatus === 'connected'
                  ? 'connected'
                  : serverStatus === 'disconnected'
                    ? 'disconnected'
                    : ''
              }`}
            />

            <span>
              {serverStatus === 'checking' && 'Checking server connection...'}
              {serverStatus === 'connected' && 'Backend connected'}
              {serverStatus === 'disconnected' && 'Backend disconnected'}
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

function Dashboard({ onNavigate, reportData, loading, error, onRetry }) {
  const stockReport = reportData?.stockReport || [];
  const performanceData = reportData?.performanceReport || {};

  const performance = Array.isArray(performanceData)
    ? performanceData[0] || {}
    : performanceData;

  const stockRecords = stockReport.length;

  const salesRevenue = formatMoney(performance.sales_revenue);
  const paymentsReceived = formatMoney(performance.payments_received);
  const outstanding = formatMoney(performance.total_outstanding);

  const fruitCount = new Set(
    stockReport.map((item) => item.fruit_name).filter(Boolean)
  ).size;

  const packagingCount = new Set(
    stockReport.map((item) => item.packaging_size).filter(Boolean)
  ).size;

  const statistics = [
    {
      title: 'Stock records',
      value: loading ? '...' : error ? '—' : stockRecords,
      description: 'Across all packaging sizes',
      icon: Boxes,
      colour: 'green'
    },
    {
      title: 'Sales revenue',
      value: loading ? '...' : error ? '—' : salesRevenue,
      description: 'Total recorded sales',
      icon: TrendingUp,
      colour: 'gold'
    },
    {
      title: 'Payments received',
      value: loading ? '...' : error ? '—' : paymentsReceived,
      description: 'Payments collected',
      icon: CircleDollarSign,
      colour: 'blue'
    },
    {
      title: 'Outstanding',
      value: loading ? '...' : error ? '—' : outstanding,
      description: 'Awaiting collection',
      icon: AlertTriangle,
      colour: 'orange'
    }
  ];

  return (
    <motion.div
      className="dashboard"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <section className="welcome-section">
        <div>
          <span className="eyebrow">BATLOUNG FARM DISTRIBUTION</span>
          <h2>Good day, Farm Admin <span>✦</span></h2>

          <p>
            Here's what's happening across your farm distribution business.
          </p>
        </div>

        <div className="welcome-decoration">
          <div className="decoration-circle circle-one" />
          <div className="decoration-circle circle-two" />
          <Sprout size={42} strokeWidth={1.3} />
        </div>
      </section>

      {error && (
        <motion.div
          className="dashboard-error"
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <strong>Unable to load dashboard data</strong>
            <p>{error}</p>
          </div>

          <button
            className="primary-button"
            onClick={onRetry}
            disabled={loading}
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </motion.div>
      )}

      <section className="statistics-grid">
        {statistics.map((stat, index) => {
          const Icon = stat.icon;

          return (
            <motion.article
              className="stat-card"
              key={stat.title}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, duration: 0.3 }}
            >
              <div className="stat-card-top">
                <div className={`stat-icon ${stat.colour}`}>
                  <Icon size={20} />
                </div>

                <span className="stat-trend">
                  <ArrowUpRight size={14} />
                </span>
              </div>

              <span className="stat-title">{stat.title}</span>
              <strong className="stat-value">{stat.value}</strong>
              <span className="stat-description">{stat.description}</span>
            </motion.article>
          );
        })}
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">GET THINGS DONE</span>
            <h3>Quick actions</h3>
            <p>Shortcuts to your everyday operations.</p>
          </div>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action, index) => {
            const Icon = action.icon;

            return (
              <motion.button
                key={action.label}
                className="quick-action-card"
                onClick={() => onNavigate(action.page)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.06 }}
              >
                <span className="quick-action-icon">
                  <Icon size={21} />
                </span>

                <span className="quick-action-label">{action.label}</span>

                <ArrowUpRight
                  size={17}
                  className="quick-action-arrow"
                />
              </motion.button>
            );
          })}
        </div>
      </section>

      <section className="dashboard-bottom-grid">
        <div className="panel inventory-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">STOCK CONTROL</span>
              <h3>Inventory overview</h3>
            </div>

            <button
              className="text-button"
              onClick={() => onNavigate('Inventory')}
            >
              View inventory <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="inventory-summary">
            <div className="inventory-summary-icon">
              <Package size={23} />
            </div>

            <div>
              <strong>
                {loading
                  ? 'Loading stock...'
                  : error
                    ? 'Unavailable'
                    : `${stockRecords} stock records`}
              </strong>

              <span>
                {loading
                  ? 'Retrieving inventory information'
                  : error
                    ? 'Inventory information unavailable'
                    : `${fruitCount} fruits across ${packagingCount} packaging sizes`}
              </span>
            </div>
          </div>

          <div className="inventory-note">
            <AlertTriangle size={17} />

            <span>
              Stock levels will be monitored here, including low-stock
              and unavailable items.
            </span>
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">BUSINESS SNAPSHOT</span>
              <h3>Recent activity</h3>
            </div>

            <Activity size={19} className="panel-heading-icon" />
          </div>

          <div className="activity-item">
            <div className="activity-icon sales">
              <ShoppingCart size={17} />
            </div>

            <div>
              <strong>Sales recorded</strong>
              <span>Sales transactions are available.</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon payment">
              <Wallet size={17} />
            </div>

            <div>
              <strong>Payments received</strong>
              <span>Payment records are available.</span>
            </div>
          </div>

          <div className="activity-item">
            <div className="activity-icon purchase">
              <ShoppingBasket size={17} />
            </div>

            <div>
              <strong>Purchases recorded</strong>
              <span>Purchase records are available.</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="dashboard-footer">
        <span>© 2026 Batloung Farm Distribution Management System</span>
        <span><span className="status-dot" /> All systems ready</span>
      </footer>
    </motion.div>
  );
}

export default App;
