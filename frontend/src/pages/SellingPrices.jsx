
import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Plus,
    RefreshCw,
    Pencil,
    X,
    Tags,
    Package,
    TrendingUp,
    Apple
} from 'lucide-react';

import {
    getSellingPrices,
    createSellingPrice,
    updateSellingPrice,
    getFruits
} from '../services/api';

import './SellingPrices.css';

const formatMoney = (amount) =>
    `M${Number(amount || 0).toFixed(2)}`;

const SellingPrices = () => {
    const [prices, setPrices] = useState([]);
    const [fruits, setFruits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [fruitFilter, setFruitFilter] = useState('ALL');
    const [showModal, setShowModal] = useState(false);
    const [editingPrice, setEditingPrice] = useState(null);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');

    const [form, setForm] = useState({
        fruit_id: '',
        packaging_size: 'SMALL',
        selling_price: ''
    });

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            const [priceResponse, fruitResponse] = await Promise.all([
                getSellingPrices(),
                getFruits()
            ]);

            setPrices(priceResponse.data || []);
            setFruits(fruitResponse.data || []);
        } catch (err) {
            setError(err.message || 'Unable to load selling prices.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredPrices = useMemo(() => {
        return prices.filter((price) => {
            const matchesSearch =
                price.fruit_name.toLowerCase().includes(search.toLowerCase()) ||
                price.packaging_size.toLowerCase().includes(search.toLowerCase()) ||
                String(price.price_id).includes(search);

            const matchesFruit =
                fruitFilter === 'ALL' ||
                String(price.fruit_id) === fruitFilter;

            return matchesSearch && matchesFruit;
        });
    }, [prices, search, fruitFilter]);

    const averagePrice = prices.length
        ? prices.reduce(
            (total, price) => total + Number(price.selling_price),
            0
        ) / prices.length
        : 0;

    const openAddModal = () => {
        setEditingPrice(null);
        setForm({
            fruit_id: '',
            packaging_size: 'SMALL',
            selling_price: ''
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const openEditModal = (price) => {
        setEditingPrice(price);
        setForm({
            fruit_id: String(price.fruit_id),
            packaging_size: price.packaging_size,
            selling_price: String(price.selling_price)
        });
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const closeModal = () => {
        if (saving) return;
        setShowModal(false);
        setEditingPrice(null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const amount = Number(form.selling_price);

        if (!editingPrice && !form.fruit_id) {
            setError('Please select a fruit.');
            return;
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            setError('Enter a valid selling price greater than zero.');
            return;
        }

        try {
            setSaving(true);
            setError('');

            if (editingPrice) {
                await updateSellingPrice(editingPrice.price_id, {
                    selling_price: amount
                });
                setSuccess('Selling price updated successfully.');
            } else {
                await createSellingPrice({
                    fruit_id: Number(form.fruit_id),
                    packaging_size: form.packaging_size,
                    selling_price: amount
                });
                setSuccess('Selling price added successfully.');
            }

            setShowModal(false);
            setEditingPrice(null);
            await loadData();
        } catch (err) {
            setError(err.message || 'Unable to save selling price.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="selling-prices-page">
            <div className="selling-prices-heading">
                <div>
                    <span className="selling-eyebrow">PRICE MANAGEMENT</span>
                    <h1>Selling Prices</h1>
                    <p>Manage selling prices for every fruit and packaging size.</p>
                </div>

                <button className="selling-primary-button" onClick={openAddModal}>
                    <Plus size={18} />
                    Add Selling Price
                </button>
            </div>

            {success && (
                <div className="selling-success">
                    {success}
                    <button onClick={() => setSuccess('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="selling-stats">
                <div className="selling-stat-card">
                    <div className="selling-stat-icon green">
                        <Tags size={21} />
                    </div>
                    <div>
                        <span>Total Price Records</span>
                        <strong>{prices.length}</strong>
                        <small>Registered selling prices</small>
                    </div>
                </div>

                <div className="selling-stat-card">
                    <div className="selling-stat-icon gold">
                        <Apple size={21} />
                    </div>
                    <div>
                        <span>Fruits with Prices</span>
                        <strong>
                            {new Set(prices.map((price) => price.fruit_id)).size}
                        </strong>
                        <small>Fruits currently listed</small>
                    </div>
                </div>

                <div className="selling-stat-card">
                    <div className="selling-stat-icon blue">
                        <Package size={21} />
                    </div>
                    <div>
                        <span>Packaging Options</span>
                        <strong>3</strong>
                        <small>Small, medium and large</small>
                    </div>
                </div>

                <div className="selling-stat-card">
                    <div className="selling-stat-icon orange">
                        <TrendingUp size={21} />
                    </div>
                    <div>
                        <span>Average Selling Price</span>
                        <strong>{formatMoney(averagePrice)}</strong>
                        <small>Across all price records</small>
                    </div>
                </div>
            </div>

            <div className="selling-table-panel">
                <div className="selling-table-heading">
                    <div>
                        <h2>Price Directory</h2>
                        <p>View and update your current fruit prices.</p>
                    </div>

                    <button
                        className="selling-refresh-button"
                        onClick={loadData}
                        disabled={loading}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>

                <div className="selling-filters">
                    <div className="selling-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search fruit, package or price ID..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <select
                        value={fruitFilter}
                        onChange={(event) => setFruitFilter(event.target.value)}
                    >
                        <option value="ALL">All Fruits</option>
                        {fruits.map((fruit) => (
                            <option
                                key={fruit.fruit_id}
                                value={String(fruit.fruit_id)}
                            >
                                {fruit.fruit_name}
                            </option>
                        ))}
                    </select>
                </div>

                {error && !showModal && (
                    <div className="selling-error">{error}</div>
                )}

                {loading ? (
                    <div className="selling-empty">
                        Loading selling prices...
                    </div>
                ) : filteredPrices.length === 0 ? (
                    <div className="selling-empty">
                        <Tags size={32} />
                        <h3>No selling prices found</h3>
                        <p>Try changing your search or add a new selling price.</p>
                    </div>
                ) : (
                    <div className="selling-table-scroll">
                        <table className="selling-table">
                            <thead>
                                <tr>
                                    <th>Price ID</th>
                                    <th>Fruit</th>
                                    <th>Packaging Size</th>
                                    <th>Selling Price</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrices.map((price) => (
                                    <motion.tr
                                        key={price.price_id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                    >
                                        <td>#{price.price_id}</td>
                                        <td>
                                            <strong>{price.fruit_name}</strong>
                                        </td>
                                        <td>
                                            <span className={`selling-size ${price.packaging_size.toLowerCase()}`}>
                                                {price.packaging_size}
                                            </span>
                                        </td>
                                        <td className="selling-amount">
                                            {formatMoney(price.selling_price)}
                                        </td>
                                        <td>
                                            <button
                                                className="selling-edit-button"
                                                onClick={() => openEditModal(price)}
                                                title="Edit selling price"
                                            >
                                                <Pencil size={15} />
                                                Edit
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="selling-table-footer">
                    Showing {filteredPrices.length} of {prices.length} price records
                </div>
            </div>

            <AnimatePresence>
                {showModal && (
                    <motion.div
                        className="selling-modal-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                    >
                        <motion.div
                            className="selling-modal"
                            initial={{ opacity: 0, y: 20, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20 }}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="selling-modal-heading">
                                <div>
                                    <h2>
                                        {editingPrice ? 'Update Selling Price' : 'Add Selling Price'}
                                    </h2>
                                    <p>
                                        {editingPrice
                                            ? 'Change the price for this packaging size.'
                                            : 'Set a selling price for a fruit and packaging size.'}
                                    </p>
                                </div>
                                <button onClick={closeModal} disabled={saving}>
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <label>Fruit</label>
                                <select
                                    value={form.fruit_id}
                                    onChange={(event) =>
                                        setForm({ ...form, fruit_id: event.target.value })
                                    }
                                    disabled={Boolean(editingPrice)}
                                    required
                                >
                                    <option value="">Select a fruit</option>
                                    {fruits.map((fruit) => (
                                        <option
                                            key={fruit.fruit_id}
                                            value={String(fruit.fruit_id)}
                                        >
                                            {fruit.fruit_name}
                                        </option>
                                    ))}
                                </select>

                                <label>Packaging Size</label>
                                <select
                                    value={form.packaging_size}
                                    onChange={(event) =>
                                        setForm({ ...form, packaging_size: event.target.value })
                                    }
                                    disabled={Boolean(editingPrice)}
                                >
                                    <option value="SMALL">Small</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LARGE">Large</option>
                                </select>

                                <label>Selling Price (M)</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="Enter selling price"
                                    value={form.selling_price}
                                    onChange={(event) =>
                                        setForm({ ...form, selling_price: event.target.value })
                                    }
                                    required
                                />

                                {error && (
                                    <div className="selling-error">{error}</div>
                                )}

                                <div className="selling-modal-actions">
                                    <button
                                        type="button"
                                        className="selling-cancel-button"
                                        onClick={closeModal}
                                        disabled={saving}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="selling-primary-button"
                                        disabled={saving}
                                    >
                                        {saving
                                            ? 'Saving...'
                                            : editingPrice
                                                ? 'Update Price'
                                                : 'Save Price'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SellingPrices;
