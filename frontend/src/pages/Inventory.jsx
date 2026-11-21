
import { useEffect, useMemo, useState } from 'react';
import {
  Package,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Boxes
} from 'lucide-react';
import { getStock } from '../services/api';
import './Inventory.css';

function Inventory() {
  const [stock, setStock] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [packageFilter, setPackageFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStock = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getStock();
      setStock(response.data || []);
    } catch (err) {
      setError(err.message || 'Unable to retrieve inventory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStock();
  }, []);

  const filteredStock = useMemo(() => {
    return stock.filter((item) => {
      const matchesSearch = item.fruit_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesPackage =
        packageFilter === 'ALL' ||
        item.packaging_size === packageFilter;

      return matchesSearch && matchesPackage;
    });
  }, [stock, searchTerm, packageFilter]);

  const totalQuantity = stock.reduce(
    (total, item) => total + Number(item.available_quantity),
    0
  );

  const lowStockCount = stock.filter(
    (item) =>
      Number(item.available_quantity) > 0 &&
      Number(item.available_quantity) <= 5
  ).length;

  const unavailableCount = stock.filter(
    (item) => Number(item.available_quantity) === 0
  ).length;

  const getStockStatus = (quantity) => {
    if (quantity === 0) {
      return {
        label: 'Unavailable',
        className: 'unavailable',
        icon: XCircle
      };
    }

    if (quantity <= 5) {
      return {
        label: 'Low Stock',
        className: 'low-stock',
        icon: AlertTriangle
      };
    }

    return {
      label: 'In Stock',
      className: 'in-stock',
      icon: CheckCircle2
    };
  };

  return (
    <div className="inventory-page">
      <div className="inventory-heading">
        <div>
          <span className="eyebrow">BATLOUNG FARM / STOCK CONTROL</span>
          <h2>Inventory</h2>
          <p>Monitor fruit availability and manage your stock levels.</p>
        </div>

        <button
          className="inventory-refresh-button"
          onClick={loadStock}
          disabled={loading}
        >
          <RefreshCw
            size={17}
            className={loading ? 'refresh-spinning' : ''}
          />
          Refresh stock
        </button>
      </div>

      <div className="inventory-statistics">
        <div className="inventory-stat-card">
          <div className="inventory-stat-icon green">
            <Boxes size={21} />
          </div>
          <div>
            <span>Total stock records</span>
            <strong>{stock.length}</strong>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon gold">
            <Package size={21} />
          </div>
          <div>
            <span>Total available packages</span>
            <strong>{totalQuantity}</strong>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon orange">
            <AlertTriangle size={21} />
          </div>
          <div>
            <span>Low stock records</span>
            <strong>{lowStockCount}</strong>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="inventory-stat-icon red">
            <XCircle size={21} />
          </div>
          <div>
            <span>Unavailable records</span>
            <strong>{unavailableCount}</strong>
          </div>
        </div>
      </div>

      <section className="inventory-table-panel">
        <div className="inventory-table-heading">
          <div>
            <h3>Stock overview</h3>
            <p>Current quantities for every fruit and packaging size.</p>
          </div>

          <span className="inventory-record-count">
            {filteredStock.length} records
          </span>
        </div>

        <div className="inventory-filters">
          <div className="inventory-search">
            <Search size={18} />
            <input
              type="search"
              placeholder="Search fruit..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <select
            value={packageFilter}
            onChange={(event) => setPackageFilter(event.target.value)}
            aria-label="Filter by packaging size"
          >
            <option value="ALL">All packaging sizes</option>
            <option value="SMALL">Small</option>
            <option value="MEDIUM">Medium</option>
            <option value="LARGE">Large</option>
          </select>
        </div>

        {error && (
          <div className="inventory-error">
            <AlertTriangle size={19} />
            <span>{error}</span>
            <button onClick={loadStock}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="inventory-message">
            <RefreshCw size={23} className="refresh-spinning" />
            <p>Loading inventory records...</p>
          </div>
        ) : !error && filteredStock.length === 0 ? (
          <div className="inventory-message">
            <Package size={27} />
            <p>No matching inventory records found.</p>
          </div>
        ) : !error ? (
          <div className="inventory-table-wrapper">
            <table className="inventory-table">
              <thead>
                <tr>
                  <th>Stock ID</th>
                  <th>Fruit</th>
                  <th>Packaging size</th>
                  <th>Available quantity</th>
                  <th>Stock status</th>
                </tr>
              </thead>

              <tbody>
                {filteredStock.map((item) => {
                  const quantity = Number(item.available_quantity);
                  const status = getStockStatus(quantity);
                  const StatusIcon = status.icon;

                  return (
                    <tr key={item.stock_id}>
                      <td>#{item.stock_id}</td>

                      <td>
                        <div className="inventory-fruit-name">
                          <span className="inventory-fruit-icon">
                            <Package size={17} />
                          </span>
                          <strong>{item.fruit_name}</strong>
                        </div>
                      </td>

                      <td>
                        <span className="package-label">
                          {item.packaging_size}
                        </span>
                      </td>

                      <td>
                        <strong className="inventory-quantity">
                          {quantity}
                        </strong>
                      </td>

                      <td>
                        <span className={`stock-status ${status.className}`}>
                          <StatusIcon size={15} />
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default Inventory;
