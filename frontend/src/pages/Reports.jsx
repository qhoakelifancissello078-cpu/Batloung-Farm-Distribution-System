
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import {
    RefreshCw,
    TrendingUp,
    ShoppingBasket,
    ShoppingCart,
    Wallet,
    Package,
    AlertCircle,
    FileText
} from 'lucide-react';
import { getReports } from '../services/api';
import './Reports.css';

const money = (value) =>
    `M${Number(value || 0).toLocaleString('en-LS', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;

const formatDate = (value) => {
    if (!value) return '—';

    return new Date(value).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

function ReportTable({ columns, rows, emptyMessage }) {
    return (
        <div className="report-table-wrap">
            <table className="report-table">
                <thead>
                    <tr>
                        {columns.map((column) => (
                            <th key={column.label}>{column.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.length > 0 ? rows.map((row, index) => (
                        <tr key={row.id ?? index}>
                            {columns.map((column) => (
                                <td key={column.label}>
                                    {column.render
                                        ? column.render(row)
                                        : row[column.key] ?? '—'}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={columns.length} className="report-empty">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

function StatusLabel({ status }) {
    const className = String(status || '').toLowerCase().replaceAll('_', '-');

    return (
        <span className={`report-status ${className}`}>
            {String(status || 'Unknown').replaceAll('_', ' ')}
        </span>
    );
}

export default function Reports() {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadReports = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await getReports();

            if (!response.success) {
                throw new Error(response.message || 'Unable to load reports.');
            }

            setReports(response.data);
        } catch (err) {
            setError(err.message || 'Unable to load business reports.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const data = reports || {
        stockReport: [],
        purchaseReport: [],
        salesReport: [],
        outstandingReport: [],
        performanceReport: {}
    };

    const performance = data.performanceReport || {};

    const stockChart = useMemo(() => {
        const grouped = {};

        (data.stockReport || []).forEach((item) => {
            grouped[item.fruit_name] =
                (grouped[item.fruit_name] || 0) + Number(item.available_quantity || 0);
        });

        return Object.entries(grouped).map(([fruit, quantity]) => ({
            fruit,
            quantity
        }));
    }, [data.stockReport]);

    const transactionChart = useMemo(() => {
        const purchases = {};
        const sales = {};

        (data.purchaseReport || []).forEach((item) => {
            purchases[item.fruit_name] =
                (purchases[item.fruit_name] || 0) + Number(item.item_total || 0);
        });

        (data.salesReport || []).forEach((item) => {
            sales[item.fruit_name] =
                (sales[item.fruit_name] || 0) + Number(item.item_total || 0);
        });

        const fruits = new Set([
            ...Object.keys(purchases),
            ...Object.keys(sales)
        ]);

        return Array.from(fruits).map((fruit) => ({
            fruit,
            purchases: purchases[fruit] || 0,
            sales: sales[fruit] || 0
        }));
    }, [data.purchaseReport, data.salesReport]);

    const totalStock = (data.stockReport || []).reduce(
        (total, item) => total + Number(item.available_quantity || 0),
        0
    );

    const lowStock = (data.stockReport || []).filter(
        (item) => Number(item.available_quantity) <= 5
    ).length;

    const purchaseColumns = [
        { label: 'Purchase ID', key: 'purchase_id' },
        { label: 'Date', render: (row) => formatDate(row.purchase_date) },
        { label: 'Supplier', key: 'supplier_name' },
        { label: 'Fruit', key: 'fruit_name' },
        { label: 'Package', key: 'packaging_size' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Unit Cost', render: (row) => money(row.unit_cost) },
        { label: 'Total', render: (row) => money(row.item_total) }
    ];

    const salesColumns = [
        { label: 'Sale ID', key: 'sale_id' },
        { label: 'Date', render: (row) => formatDate(row.sale_date) },
        { label: 'Vendor', key: 'vendor_name' },
        { label: 'Fruit', key: 'fruit_name' },
        { label: 'Package', key: 'packaging_size' },
        { label: 'Quantity', key: 'quantity' },
        { label: 'Unit Price', render: (row) => money(row.unit_price) },
        { label: 'Item Total', render: (row) => money(row.item_total) },
        { label: 'Status', render: (row) => <StatusLabel status={row.payment_status} /> }
    ];

    const stockColumns = [
        { label: 'Fruit', key: 'fruit_name' },
        { label: 'Availability', render: (row) => <StatusLabel status={row.fruit_status} /> },
        { label: 'Package Size', key: 'packaging_size' },
        { label: 'Available Quantity', key: 'available_quantity' },
        {
            label: 'Stock Level',
            render: (row) => {
                const quantity = Number(row.available_quantity);
                return (
                    <span className={`stock-level ${quantity === 0 ? 'empty' : quantity <= 5 ? 'low' : 'healthy'}`}>
                        {quantity === 0 ? 'Out of stock' : quantity <= 5 ? 'Low stock' : 'In stock'}
                    </span>
                );
            }
        }
    ];

    const outstandingColumns = [
        { label: 'Sale ID', key: 'sale_id' },
        { label: 'Vendor', key: 'vendor_name' },
        { label: 'Sale Date', render: (row) => formatDate(row.sale_date) },
        { label: 'Sale Total', render: (row) => money(row.total_amount) },
        { label: 'Paid', render: (row) => money(row.total_paid) },
        { label: 'Outstanding', render: (row) => money(row.outstanding_balance) },
        { label: 'Status', render: (row) => <StatusLabel status={row.payment_status} /> }
    ];

    if (loading) {
        return (
            <div className="reports-loading">
                <RefreshCw size={25} className="reports-spin" />
                <p>Preparing your business reports...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="reports-error">
                <AlertCircle size={30} />
                <h3>Reports could not be loaded</h3>
                <p>{error}</p>
                <button onClick={loadReports}>
                    <RefreshCw size={16} /> Try Again
                </button>
            </div>
        );
    }

    return (
        <motion.div
            className="reports-page"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
        >
            <div className="reports-heading">
                <div>
                    <span className="reports-eyebrow">BUSINESS ANALYTICS</span>
                    <h1>Reports & Analytics</h1>
                    <p>Monitor stock, purchases, sales and overall farm performance.</p>
                </div>

                <button className="reports-refresh" onClick={loadReports}>
                    <RefreshCw size={17} /> Refresh Reports
                </button>
            </div>

            <div className="report-kpi-grid">
                <div className="report-kpi">
                    <div className="report-kpi-icon green"><Package size={21} /></div>
                    <span>Total Available Packages</span>
                    <strong>{totalStock.toLocaleString()}</strong>
                    <small>Across all fruit and package sizes</small>
                </div>

                <div className="report-kpi">
                    <div className="report-kpi-icon gold"><ShoppingBasket size={21} /></div>
                    <span>Total Purchase Value</span>
                    <strong>{money(performance.purchase_value)}</strong>
                    <small>{performance.total_purchases || 0} purchase transactions</small>
                </div>

                <div className="report-kpi">
                    <div className="report-kpi-icon blue"><TrendingUp size={21} /></div>
                    <span>Sales Revenue</span>
                    <strong>{money(performance.sales_revenue)}</strong>
                    <small>{performance.total_sales || 0} sales transactions</small>
                </div>

                <div className="report-kpi">
                    <div className="report-kpi-icon orange"><Wallet size={21} /></div>
                    <span>Outstanding Balance</span>
                    <strong>{money(performance.total_outstanding)}</strong>
                    <small>Payments still due from vendors</small>
                </div>
            </div>

            <div className="report-secondary-stats">
                <div>
                    <span>Payments Received</span>
                    <strong>{money(performance.payments_received)}</strong>
                </div>
                <div>
                    <span>Stock Records</span>
                    <strong>{data.stockReport?.length || 0}</strong>
                </div>
                <div>
                    <span>Low / Empty Stock Records</span>
                    <strong>{lowStock}</strong>
                </div>
                <div>
                    <span>Outstanding Sales</span>
                    <strong>{data.outstandingReport?.length || 0}</strong>
                </div>
            </div>

            <section className="report-panel">
                <div className="report-section-heading">
                    <div>
                        <h2>Stock Overview</h2>
                        <p>Available packages grouped by fruit.</p>
                    </div>
                    <span className="report-section-icon"><Package size={19} /></span>
                </div>

                <div className="report-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stockChart} margin={{ top: 10, right: 15, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="fruit" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <Tooltip />
                            <Bar dataKey="quantity" name="Available Packages" fill="#3D8B5B" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <ReportTable
                    columns={stockColumns}
                    rows={data.stockReport || []}
                    emptyMessage="No stock records available."
                />
            </section>

            <section className="report-panel">
                <div className="report-section-heading">
                    <div>
                        <h2>Purchases vs Sales</h2>
                        <p>Compare purchase costs and sales values by fruit.</p>
                    </div>
                    <span className="report-section-icon"><TrendingUp size={19} /></span>
                </div>

                <div className="report-chart">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={transactionChart} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="fruit" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip formatter={(value) => money(value)} />
                            <Legend />
                            <Bar dataKey="purchases" name="Purchase Value" fill="#E8B95B" radius={[5, 5, 0, 0]} />
                            <Bar dataKey="sales" name="Sales Value" fill="#3D8B5B" radius={[5, 5, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            <section className="report-panel">
                <div className="report-section-heading">
                    <div>
                        <h2>Purchase Report</h2>
                        <p>Purchases recorded from farm suppliers.</p>
                    </div>
                    <span className="report-section-icon"><ShoppingBasket size={19} /></span>
                </div>

                <ReportTable
                    columns={purchaseColumns}
                    rows={data.purchaseReport || []}
                    emptyMessage="No purchase records available."
                />
            </section>

            <section className="report-panel">
                <div className="report-section-heading">
                    <div>
                        <h2>Sales Report</h2>
                        <p>Sales made to registered vendors.</p>
                    </div>
                    <span className="report-section-icon"><ShoppingCart size={19} /></span>
                </div>

                <ReportTable
                    columns={salesColumns}
                    rows={data.salesReport || []}
                    emptyMessage="No sales records available."
                />
            </section>

            <section className="report-panel">
                <div className="report-section-heading">
                    <div>
                        <h2>Outstanding Balances</h2>
                        <p>Track unpaid amounts and vendor payment status.</p>
                    </div>
                    <span className="report-section-icon"><Wallet size={19} /></span>
                </div>

                <ReportTable
                    columns={outstandingColumns}
                    rows={data.outstandingReport || []}
                    emptyMessage="There are no outstanding balances."
                />
            </section>

            <section className="report-performance">
                <div className="report-performance-heading">
                    <FileText size={21} />
                    <div>
                        <h2>Business Performance Summary</h2>
                        <p>Overall financial activity recorded by Batloung Farm.</p>
                    </div>
                </div>

                <div className="performance-grid">
                    <div>
                        <span>Total Purchases</span>
                        <strong>{performance.total_purchases || 0}</strong>
                    </div>
                    <div>
                        <span>Purchase Value</span>
                        <strong>{money(performance.purchase_value)}</strong>
                    </div>
                    <div>
                        <span>Total Sales</span>
                        <strong>{performance.total_sales || 0}</strong>
                    </div>
                    <div>
                        <span>Sales Revenue</span>
                        <strong>{money(performance.sales_revenue)}</strong>
                    </div>
                    <div>
                        <span>Payments Received</span>
                        <strong>{money(performance.payments_received)}</strong>
                    </div>
                    <div>
                        <span>Total Outstanding</span>
                        <strong>{money(performance.total_outstanding)}</strong>
                    </div>
                </div>
            </section>
        </motion.div>
    );
}
