import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ShoppingBasket,
    Search,
    RefreshCw,
    Plus,
    Eye,
    X,
    Trash2,
    CalendarDays,
    Truck,
    Package,
    Boxes,
    CircleDollarSign,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

import {
    getPurchases,
    getPurchaseById,
    createPurchase,
    getSuppliers,
    getFruits
} from '../services/api';

import './Purchases.css';

const emptyItem = () => ({
    fruit_id: '',
    packaging_size: 'SMALL',
    quantity: '1',
    unit_cost: ''
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

function Purchases() {
    const [purchases, setPurchases] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [fruits, setFruits] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedPurchase, setSelectedPurchase] = useState(null);

    const [supplierId, setSupplierId] = useState('');
    const [items, setItems] = useState([emptyItem()]);
    const [saving, setSaving] = useState(false);

    const loadData = async (showRefresh = false) => {
        if (showRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError('');

        try {
            const [purchaseResponse, supplierResponse, fruitResponse] =
                await Promise.all([
                    getPurchases(),
                    getSuppliers(),
                    getFruits()
                ]);

            setPurchases(purchaseResponse.data || []);
            setSuppliers(supplierResponse.data || []);
            setFruits(fruitResponse.data || []);
        } catch (err) {
            setError(err.message || 'Unable to load purchase information.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredPurchases = useMemo(() => {
        const term = searchTerm.toLowerCase().trim();

        if (!term) return purchases;

        return purchases.filter((purchase) =>
            [
                purchase.purchase_id,
                purchase.supplier_name,
                purchase.total_amount,
                purchase.total_items
            ].some((value) =>
                String(value ?? '').toLowerCase().includes(term)
            )
        );
    }, [purchases, searchTerm]);

    const totalValue = useMemo(
        () => purchases.reduce(
            (total, purchase) => total + Number(purchase.total_amount || 0),
            0
        ),
        [purchases]
    );

    const totalItems = useMemo(
        () => purchases.reduce(
            (total, purchase) => total + Number(purchase.total_items || 0),
            0
        ),
        [purchases]
    );

    const calculatedTotal = useMemo(
        () => items.reduce((total, item) => {
            return total +
                (Number(item.quantity) * Number(item.unit_cost || 0));
        }, 0),
        [items]
    );

    const openModal = () => {
        setSupplierId('');
        setItems([emptyItem()]);
        setError('');
        setSuccess('');
        setModalOpen(true);
    };

    const closeModal = () => {
        if (!saving) setModalOpen(false);
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
        if (items.length === 1) return;

        setItems((current) =>
            current.filter((_, itemIndex) => itemIndex !== index)
        );
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!supplierId) {
            setError('Please select a supplier.');
            return;
        }

        if (items.some((item) =>
            !item.fruit_id ||
            !item.quantity ||
            Number(item.quantity) <= 0 ||
            !Number.isInteger(Number(item.quantity)) ||
            item.unit_cost === '' ||
            !Number.isFinite(Number(item.unit_cost)) ||
            Number(item.unit_cost) < 0
        )) {
            setError('Please complete all item fields using valid quantities and costs.');
            return;
        }

        const purchaseData = {
            supplier_id: Number(supplierId),
            items: items.map((item) => ({
                fruit_id: Number(item.fruit_id),
                packaging_size: item.packaging_size,
                quantity: Number(item.quantity),
                unit_cost: Number(item.unit_cost)
            }))
        };

        setSaving(true);

        try {
            await createPurchase(purchaseData);

            setModalOpen(false);
            setSuccess('Purchase recorded successfully. Stock has been updated.');

            await loadData(true);
        } catch (err) {
            setError(err.message || 'Unable to record purchase.');
        } finally {
            setSaving(false);
        }
    };

    const viewPurchase = async (purchaseId) => {
        setError('');

        try {
            const response = await getPurchaseById(purchaseId);
            setSelectedPurchase(response.data);
            setDetailsOpen(true);
        } catch (err) {
            setError(err.message || 'Unable to retrieve purchase details.');
        }
    };

    return (
        <motion.section
            className="purchases-page"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="purchases-heading">
                <div>
                    <span className="eyebrow">BATLOUNG FARM / WORKSPACE</span>
                    <h2>Purchases</h2>
                    <p>Record supplier purchases and monitor incoming stock.</p>
                </div>

                <button className="purchase-primary-button" onClick={openModal}>
                    <Plus size={18} />
                    New purchase
                </button>
            </div>

            {error && !modalOpen && (
                <div className="purchase-alert error">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                    <button onClick={() => setError('')} aria-label="Dismiss">
                        <X size={17} />
                    </button>
                </div>
            )}

            {success && (
                <div className="purchase-alert success">
                    <CheckCircle2 size={18} />
                    <span>{success}</span>
                    <button onClick={() => setSuccess('')} aria-label="Dismiss">
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="purchase-statistics">
                <article className="purchase-stat-card">
                    <div className="purchase-stat-icon green">
                        <ShoppingBasket size={21} />
                    </div>
                    <span>Total purchases</span>
                    <strong>{loading ? '...' : purchases.length}</strong>
                    <small>Recorded transactions</small>
                </article>

                <article className="purchase-stat-card">
                    <div className="purchase-stat-icon gold">
                        <CircleDollarSign size={21} />
                    </div>
                    <span>Total purchase value</span>
                    <strong>{loading ? '...' : formatMoney(totalValue)}</strong>
                    <small>Combined purchase amount</small>
                </article>

                <article className="purchase-stat-card">
                    <div className="purchase-stat-icon blue">
                        <Boxes size={21} />
                    </div>
                    <span>Items purchased</span>
                    <strong>{loading ? '...' : totalItems}</strong>
                    <small>Purchase detail entries</small>
                </article>

                <article className="purchase-stat-card">
                    <div className="purchase-stat-icon orange">
                        <Truck size={21} />
                    </div>
                    <span>Registered suppliers</span>
                    <strong>{loading ? '...' : suppliers.length}</strong>
                    <small>Available supplier records</small>
                </article>
            </div>

            <div className="purchases-directory">
                <div className="purchases-directory-heading">
                    <div>
                        <h3>Purchase directory</h3>
                        <p>View and manage your recorded purchase transactions.</p>
                    </div>

                    <button
                        className="purchase-refresh-button"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                    >
                        <RefreshCw
                            size={16}
                            className={refreshing ? 'spinning' : ''}
                        />
                        Refresh
                    </button>
                </div>

                <div className="purchase-search">
                    <Search size={18} />
                    <input
                        type="search"
                        placeholder="Search by purchase ID or supplier..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="purchase-empty-state">
                        <RefreshCw className="spinning" size={25} />
                        <strong>Loading purchases...</strong>
                        <span>Retrieving purchase records.</span>
                    </div>
                ) : filteredPurchases.length === 0 ? (
                    <div className="purchase-empty-state">
                        <ShoppingBasket size={30} />
                        <strong>No purchases found</strong>
                        <span>
                            {searchTerm
                                ? 'Try another search term.'
                                : 'Your recorded purchases will appear here.'}
                        </span>
                    </div>
                ) : (
                    <div className="purchase-table-wrapper">
                        <table className="purchase-table">
                            <thead>
                                <tr>
                                    <th>Purchase ID</th>
                                    <th>Supplier</th>
                                    <th>Purchase date</th>
                                    <th>Total items</th>
                                    <th>Total amount</th>
                                    <th>Details</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPurchases.map((purchase) => (
                                    <tr key={purchase.purchase_id}>
                                        <td>
                                            <span className="purchase-id">
                                                #{purchase.purchase_id}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="purchase-supplier-cell">
                                                <span className="supplier-avatar">
                                                    <Truck size={16} />
                                                </span>
                                                <strong>{purchase.supplier_name}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <span className="purchase-date-cell">
                                                <CalendarDays size={15} />
                                                {formatDate(purchase.purchase_date)}
                                            </span>
                                        </td>
                                        <td>{purchase.total_items}</td>
                                        <td className="purchase-amount">
                                            {formatMoney(purchase.total_amount)}
                                        </td>
                                        <td>
                                            <button
                                                className="purchase-view-button"
                                                onClick={() => viewPurchase(purchase.purchase_id)}
                                            >
                                                <Eye size={16} />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="purchase-directory-footer">
                    Showing {filteredPurchases.length} of {purchases.length} purchases
                </div>
            </div>

            <AnimatePresence>
                {modalOpen && (
                    <motion.div
                        className="purchase-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) closeModal();
                        }}
                    >
                        <motion.div
                            className="purchase-modal"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15 }}
                        >
                            <div className="purchase-modal-header">
                                <div>
                                    <span className="eyebrow">INCOMING STOCK</span>
                                    <h3>Record a purchase</h3>
                                    <p>Add a supplier purchase and its fruit items.</p>
                                </div>

                                <button
                                    className="purchase-modal-close"
                                    onClick={closeModal}
                                    disabled={saving}
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="purchase-alert error">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="purchase-form-field">
                                    <label htmlFor="purchase-supplier">Supplier</label>
                                    <select
                                        id="purchase-supplier"
                                        value={supplierId}
                                        onChange={(event) => setSupplierId(event.target.value)}
                                        required
                                    >
                                        <option value="">Select a supplier</option>
                                        {suppliers.map((supplier) => (
                                            <option
                                                key={supplier.supplier_id}
                                                value={supplier.supplier_id}
                                            >
                                                {supplier.business_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="purchase-items-heading">
                                    <div>
                                        <h4>Purchase items</h4>
                                        <p>Add the fruits included in this purchase.</p>
                                    </div>

                                    <button
                                        type="button"
                                        className="purchase-add-item-button"
                                        onClick={addItem}
                                    >
                                        <Plus size={16} />
                                        Add item
                                    </button>
                                </div>

                                <div className="purchase-item-list">
                                    {items.map((item, index) => (
                                        <div className="purchase-item-card" key={index}>
                                            <div className="purchase-item-card-heading">
                                                <strong>Item {index + 1}</strong>
                                                {items.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="purchase-remove-item"
                                                        onClick={() => removeItem(index)}
                                                        aria-label={`Remove item ${index + 1}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="purchase-item-fields">
                                                <div className="purchase-form-field fruit-field">
                                                    <label>Fruit</label>
                                                    <select
                                                        value={item.fruit_id}
                                                        onChange={(event) =>
                                                            updateItem(index, 'fruit_id', event.target.value)
                                                        }
                                                        required
                                                    >
                                                        <option value="">Select fruit</option>
                                                        {fruits
                                                            .filter((fruit) => fruit.status === 'AVAILABLE')
                                                            .map((fruit) => (
                                                                <option
                                                                    key={fruit.fruit_id}
                                                                    value={fruit.fruit_id}
                                                                >
                                                                    {fruit.fruit_name}
                                                                </option>
                                                            ))}
                                                    </select>
                                                </div>

                                                <div className="purchase-form-field">
                                                    <label>Packaging</label>
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

                                                <div className="purchase-form-field">
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

                                                <div className="purchase-form-field">
                                                    <label>Unit cost (M)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_cost}
                                                        onChange={(event) =>
                                                            updateItem(index, 'unit_cost', event.target.value)
                                                        }
                                                        placeholder="0.00"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="purchase-item-subtotal">
                                                Item subtotal:
                                                <strong>
                                                    {formatMoney(
                                                        Number(item.quantity) *
                                                        Number(item.unit_cost || 0)
                                                    )}
                                                </strong>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="purchase-total-panel">
                                    <span>Purchase total</span>
                                    <strong>{formatMoney(calculatedTotal)}</strong>
                                </div>

                                <div className="purchase-modal-actions">
                                    <button
                                        type="button"
                                        className="purchase-cancel-button"
                                        onClick={closeModal}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        className="purchase-primary-button"
                                        disabled={saving || suppliers.length === 0 || fruits.length === 0}
                                    >
                                        {saving ? 'Recording...' : 'Record purchase'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {detailsOpen && selectedPurchase && (
                    <motion.div
                        className="purchase-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) setDetailsOpen(false);
                        }}
                    >
                        <motion.div
                            className="purchase-modal purchase-details-modal"
                            initial={{ opacity: 0, y: 20, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15 }}
                        >
                            <div className="purchase-modal-header">
                                <div>
                                    <span className="eyebrow">PURCHASE DETAILS</span>
                                    <h3>Purchase #{selectedPurchase.purchase_id}</h3>
                                    <p>Full details of this recorded transaction.</p>
                                </div>

                                <button
                                    className="purchase-modal-close"
                                    onClick={() => setDetailsOpen(false)}
                                    aria-label="Close"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="purchase-detail-summary">
                                <div>
                                    <span>Supplier</span>
                                    <strong>{selectedPurchase.supplier_name}</strong>
                                </div>
                                <div>
                                    <span>Purchase date</span>
                                    <strong>{formatDate(selectedPurchase.purchase_date)}</strong>
                                </div>
                                <div>
                                    <span>Total amount</span>
                                    <strong>{formatMoney(selectedPurchase.total_amount)}</strong>
                                </div>
                            </div>

                            <h4 className="purchase-detail-items-title">Purchased items</h4>

                            <div className="purchase-detail-items">
                                {(selectedPurchase.items || []).map((item) => (
                                    <div
                                        className="purchase-detail-item"
                                        key={item.purchase_detail_id}
                                    >
                                        <div className="purchase-detail-fruit-icon">
                                            <Package size={19} />
                                        </div>

                                        <div className="purchase-detail-fruit">
                                            <strong>{item.fruit_name}</strong>
                                            <span>
                                                {item.packaging_size} · Quantity {item.quantity}
                                            </span>
                                        </div>

                                        <div className="purchase-detail-cost">
                                            <strong>
                                                {formatMoney(Number(item.quantity) * Number(item.unit_cost))}
                                            </strong>
                                            <span>{formatMoney(item.unit_cost)} each</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="purchase-modal-actions">
                                <button
                                    className="purchase-cancel-button"
                                    onClick={() => setDetailsOpen(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
}

export default Purchases;