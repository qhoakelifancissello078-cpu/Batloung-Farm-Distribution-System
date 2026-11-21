
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ShoppingCart,
    Search,
    RefreshCw,
    Plus,
    Eye,
    X,
    Trash2,
    CalendarDays,
    Users,
    Package,
    CircleDollarSign,
    AlertCircle,
    CheckCircle2,
    Boxes
} from 'lucide-react';
import {
    getSales,
    getSaleById,
    createSale,
    getVendors,
    getFruits,
    getStock
} from '../services/api';
import './Sales.css';

const emptyItem = () => ({
    fruit_id: '',
    packaging_size: 'SMALL',
    quantity: 1
});

const formatMoney = (amount) =>
    `M${Number(amount || 0).toFixed(2)}`;

const formatDate = (date) => {
    if (!date) return '—';

    return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const Sales = () => {
    const [sales, setSales] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [fruits, setFruits] = useState([]);
    const [stock, setStock] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);

    const [vendorId, setVendorId] = useState('');
    const [items, setItems] = useState([emptyItem()]);

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            const [salesResult, vendorsResult, fruitsResult, stockResult] =
                await Promise.all([
                    getSales(),
                    getVendors(),
                    getFruits(),
                    getStock()
                ]);

            setSales(salesResult.data || []);
            setVendors(vendorsResult.data || []);
            setFruits(fruitsResult.data || []);
            setStock(stockResult.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const availableFruits = useMemo(
        () => fruits.filter((fruit) => fruit.status === 'AVAILABLE'),
        [fruits]
    );

    const totalRevenue = useMemo(
        () => sales.reduce(
            (total, sale) => total + Number(sale.total_amount || 0),
            0
        ),
        [sales]
    );

    const paidSales = useMemo(
        () => sales.filter((sale) => sale.payment_status === 'PAID').length,
        [sales]
    );

    const outstandingSales = useMemo(
        () => sales.filter((sale) => sale.payment_status !== 'PAID').length,
        [sales]
    );

    const filteredSales = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        if (!term) return sales;

        return sales.filter((sale) =>
            String(sale.sale_id).includes(term) ||
            (sale.vendor_name || '').toLowerCase().includes(term) ||
            (sale.payment_status || '').toLowerCase().includes(term) ||
            String(sale.total_amount).includes(term)
        );
    }, [sales, searchTerm]);

    const getAvailableStock = (fruitId, packagingSize) => {
        const record = stock.find(
            (entry) =>
                Number(entry.fruit_id) === Number(fruitId) &&
                entry.packaging_size === packagingSize
        );

        return record ? Number(record.available_quantity) : 0;
    };

    const updateItem = (index, field, value) => {
        setItems((current) =>
            current.map((item, itemIndex) =>
                itemIndex === index
                    ? { ...item, [field]: value }
                    : item
            )
        );
    };

    const addItem = () => {
        setItems((current) => [...current, emptyItem()]);
    };

    const removeItem = (index) => {
        setItems((current) =>
            current.length === 1
                ? current
                : current.filter((_, itemIndex) => itemIndex !== index)
        );
    };

    const resetForm = () => {
        setVendorId('');
        setItems([emptyItem()]);
        setError('');
    };

    const handleCreateSale = async (event) => {
        event.preventDefault();

        if (!vendorId) {
            setError('Please select a vendor.');
            return;
        }

        for (const item of items) {
            if (!item.fruit_id) {
                setError('Please select a fruit for every sale item.');
                return;
            }

            const quantity = Number(item.quantity);
            const available = getAvailableStock(
                item.fruit_id,
                item.packaging_size
            );

            if (!Number.isInteger(quantity) || quantity <= 0) {
                setError('Each quantity must be a positive whole number.');
                return;
            }

            if (quantity > available) {
                const fruit = fruits.find(
                    (entry) => Number(entry.fruit_id) === Number(item.fruit_id)
                );

                setError(
                    `Insufficient stock for ${fruit?.fruit_name || 'selected fruit'} (${item.packaging_size}). Available: ${available}.`
                );
                return;
            }
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const saleData = {
                vendor_id: Number(vendorId),
                items: items.map((item) => ({
                    fruit_id: Number(item.fruit_id),
                    packaging_size: item.packaging_size,
                    quantity: Number(item.quantity)
                }))
            };

            const result = await createSale(saleData);

            setModalOpen(false);
            resetForm();

            setSuccess(
                result.message || 'Sale recorded successfully.'
            );

            await loadData(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleViewSale = async (saleId) => {
        try {
            setError('');
            const result = await getSaleById(saleId);
            setSelectedSale(result.data);
            setDetailsOpen(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const openNewSale = () => {
        resetForm();
        setSuccess('');
        setModalOpen(true);
    };

    return (
        <div className="sales-page">
            <div className="sales-heading">
                <div>
                    <span className="sales-eyebrow">TRANSACTION MANAGEMENT</span>
                    <h1>Sales</h1>
                    <p>Record customer purchases and monitor sales activity.</p>
                </div>

                <button className="sales-primary-btn" onClick={openNewSale}>
                    <Plus size={19} />
                    Record Sale
                </button>
            </div>

            {error && (
                <div className="sales-alert sales-alert-error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} aria-label="Dismiss error">
                        <X size={17} />
                    </button>
                </div>
            )}

            {success && (
                <div className="sales-alert sales-alert-success">
                    <CheckCircle2 size={18} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} aria-label="Dismiss message">
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="sales-stat-grid">
                <div className="sales-stat-card">
                    <div className="sales-stat-icon green">
                        <ShoppingCart size={22} />
                    </div>
                    <div>
                        <span>Total sales</span>
                        <h2>{sales.length}</h2>
                        <p>Recorded transactions</p>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div className="sales-stat-icon gold">
                        <CircleDollarSign size={22} />
                    </div>
                    <div>
                        <span>Sales revenue</span>
                        <h2>{formatMoney(totalRevenue)}</h2>
                        <p>Total recorded sales value</p>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div className="sales-stat-icon blue">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <span>Fully paid</span>
                        <h2>{paidSales}</h2>
                        <p>Paid transactions</p>
                    </div>
                </div>

                <div className="sales-stat-card">
                    <div className="sales-stat-icon orange">
                        <AlertCircle size={22} />
                    </div>
                    <div>
                        <span>Payment pending</span>
                        <h2>{outstandingSales}</h2>
                        <p>Unpaid or partially paid</p>
                    </div>
                </div>
            </div>

            <div className="sales-content-card">
                <div className="sales-content-heading">
                    <div>
                        <h2>Sales directory</h2>
                        <p>View and manage recorded sales transactions.</p>
                    </div>

                    <button
                        className="sales-refresh-btn"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? 'sales-spinning' : ''}
                        />
                        Refresh
                    </button>
                </div>

                <div className="sales-toolbar">
                    <div className="sales-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search by sale ID, vendor or status..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                        />
                    </div>

                    <span className="sales-result-count">
                        {filteredSales.length} transaction(s)
                    </span>
                </div>

                {loading ? (
                    <div className="sales-state">
                        <RefreshCw className="sales-spinning" size={25} />
                        <p>Loading sales records...</p>
                    </div>
                ) : filteredSales.length === 0 ? (
                    <div className="sales-state">
                        <ShoppingCart size={34} />
                        <h3>No sales found</h3>
                        <p>
                            {searchTerm
                                ? 'Try changing your search.'
                                : 'Record your first sale to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="sales-table-wrap">
                        <table className="sales-table">
                            <thead>
                                <tr>
                                    <th>Sale ID</th>
                                    <th>Vendor</th>
                                    <th>Date</th>
                                    <th>Items</th>
                                    <th>Total amount</th>
                                    <th>Payment status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSales.map((sale) => (
                                    <tr key={sale.sale_id}>
                                        <td className="sales-id">
                                            #{sale.sale_id}
                                        </td>
                                        <td>
                                            <div className="sales-vendor-cell">
                                                <span className="sales-vendor-icon">
                                                    <Users size={16} />
                                                </span>
                                                <strong>{sale.vendor_name}</strong>
                                            </div>
                                        </td>
                                        <td>{formatDate(sale.sale_date)}</td>
                                        <td>{sale.total_items}</td>
                                        <td className="sales-amount">
                                            {formatMoney(sale.total_amount)}
                                        </td>
                                        <td>
                                            <span
                                                className={`sales-status ${String(sale.payment_status || '').toLowerCase()}`}
                                            >
                                                {sale.payment_status || 'UNKNOWN'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="sales-view-btn"
                                                onClick={() => handleViewSale(sale.sale_id)}
                                                title="View sale details"
                                            >
                                                <Eye size={17} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {modalOpen && (
                    <div className="sales-modal-backdrop">
                        <motion.div
                            className="sales-modal"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        >
                            <div className="sales-modal-heading">
                                <div>
                                    <span className="sales-eyebrow">NEW TRANSACTION</span>
                                    <h2>Record a sale</h2>
                                    <p>Choose a vendor and add the fruits being sold.</p>
                                </div>
                                <button
                                    className="sales-close-btn"
                                    onClick={() => setModalOpen(false)}
                                    aria-label="Close"
                                >
                                    <X size={21} />
                                </button>
                            </div>

                            <form onSubmit={handleCreateSale}>
                                <div className="sales-form-section">
                                    <label htmlFor="sale-vendor">Select vendor</label>
                                    <select
                                        id="sale-vendor"
                                        value={vendorId}
                                        onChange={(event) => setVendorId(event.target.value)}
                                        required
                                    >
                                        <option value="">Choose a vendor</option>
                                        {vendors.map((vendor) => (
                                            <option
                                                key={vendor.vendor_id}
                                                value={vendor.vendor_id}
                                            >
                                                {vendor.vendor_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="sales-items-heading">
                                    <div>
                                        <h3>Sale items</h3>
                                        <p>Add one or more fruit products.</p>
                                    </div>
                                    <button
                                        type="button"
                                        className="sales-add-item-btn"
                                        onClick={addItem}
                                    >
                                        <Plus size={16} />
                                        Add item
                                    </button>
                                </div>

                                <div className="sales-item-list">
                                    {items.map((item, index) => {
                                        const available = getAvailableStock(
                                            item.fruit_id,
                                            item.packaging_size
                                        );

                                        return (
                                            <div className="sales-item-row" key={index}>
                                                <div className="sales-item-top">
                                                    <strong>Item {index + 1}</strong>
                                                    <button
                                                        type="button"
                                                        className="sales-remove-item"
                                                        onClick={() => removeItem(index)}
                                                        disabled={items.length === 1}
                                                        title="Remove item"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="sales-item-fields">
                                                    <div className="sales-form-section">
                                                        <label>Fruit</label>
                                                        <select
                                                            value={item.fruit_id}
                                                            onChange={(event) =>
                                                                updateItem(index, 'fruit_id', event.target.value)
                                                            }
                                                            required
                                                        >
                                                            <option value="">Select fruit</option>
                                                            {availableFruits.map((fruit) => (
                                                                <option
                                                                    key={fruit.fruit_id}
                                                                    value={fruit.fruit_id}
                                                                >
                                                                    {fruit.fruit_name}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div className="sales-form-section">
                                                        <label>Packaging size</label>
                                                        <select
                                                            value={item.packaging_size}
                                                            onChange={(event) =>
                                                                updateItem(index, 'packaging_size', event.target.value)
                                                            }
                                                        >
                                                            <option value="SMALL">Small</option>
                                                            <option value="MEDIUM">Medium</option>
                                                            <option value="LARGE">Large</option>
                                                        </select>
                                                    </div>

                                                    <div className="sales-form-section">
                                                        <label>Quantity</label>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            step="1"
                                                            value={item.quantity}
                                                            onChange={(event) =>
                                                                updateItem(index, 'quantity', event.target.value)
                                                            }
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="sales-stock-note">
                                                    <Boxes size={15} />
                                                    Available stock: <strong>{available}</strong>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="sales-price-note">
                                    <CircleDollarSign size={18} />
                                    Selling prices and the final total will be calculated automatically.
                                </div>

                                <div className="sales-modal-actions">
                                    <button
                                        type="button"
                                        className="sales-cancel-btn"
                                        onClick={() => setModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="sales-primary-btn"
                                        disabled={saving}
                                    >
                                        {saving ? 'Recording sale...' : 'Record Sale'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {detailsOpen && selectedSale && (
                    <div className="sales-modal-backdrop">
                        <motion.div
                            className="sales-modal sales-details-modal"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        >
                            <div className="sales-modal-heading">
                                <div>
                                    <span className="sales-eyebrow">TRANSACTION DETAILS</span>
                                    <h2>Sale #{selectedSale.sale_id}</h2>
                                    <p>{selectedSale.vendor_name}</p>
                                </div>
                                <button
                                    className="sales-close-btn"
                                    onClick={() => setDetailsOpen(false)}
                                    aria-label="Close"
                                >
                                    <X size={21} />
                                </button>
                            </div>

                            <div className="sales-detail-summary">
                                <div>
                                    <span><CalendarDays size={15} /> Sale date</span>
                                    <strong>{formatDate(selectedSale.sale_date)}</strong>
                                </div>
                                <div>
                                    <span><CircleDollarSign size={15} /> Total amount</span>
                                    <strong>{formatMoney(selectedSale.total_amount)}</strong>
                                </div>
                                <div>
                                    <span><CheckCircle2 size={15} /> Payment status</span>
                                    <strong>{selectedSale.payment_status}</strong>
                                </div>
                            </div>

                            <h3 className="sales-detail-title">Items sold</h3>

                            <div className="sales-table-wrap">
                                <table className="sales-table sales-detail-table">
                                    <thead>
                                        <tr>
                                            <th>Fruit</th>
                                            <th>Package</th>
                                            <th>Quantity</th>
                                            <th>Unit price</th>
                                            <th>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedSale.items || []).map((item) => (
                                            <tr key={item.sales_detail_id}>
                                                <td>{item.fruit_name}</td>
                                                <td>{item.packaging_size}</td>
                                                <td>{item.quantity}</td>
                                                <td>{formatMoney(item.unit_price)}</td>
                                                <td className="sales-amount">
                                                    {formatMoney(item.subtotal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="sales-detail-total">
                                <span>Sale total</span>
                                <strong>{formatMoney(selectedSale.total_amount)}</strong>
                            </div>

                            <div className="sales-modal-actions">
                                <button
                                    className="sales-primary-btn"
                                    onClick={() => setDetailsOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Sales;
