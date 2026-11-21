
import { useEffect, useMemo, useState } from 'react';
import {
    Apple,
    Plus,
    Search,
    RefreshCw,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    XCircle,
    Leaf,
    AlertCircle
} from 'lucide-react';

import {
    getFruits,
    createFruit,
    updateFruit,
    deleteFruit
} from '../services/api';

import './Fruits.css';

const emptyForm = {
    fruit_name: '',
    description: '',
    status: 'AVAILABLE'
};

const Fruits = () => {
    const [fruits, setFruits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingFruit, setEditingFruit] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchFruits = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            const response = await getFruits();
            setFruits(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchFruits();
    }, []);

    const availableCount = fruits.filter(
        fruit => fruit.status === 'AVAILABLE'
    ).length;

    const unavailableCount = fruits.filter(
        fruit => fruit.status === 'UNAVAILABLE'
    ).length;

    const filteredFruits = useMemo(() => {
        return fruits.filter(fruit => {
            const matchesSearch =
                fruit.fruit_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (fruit.description || '').toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus =
                statusFilter === 'ALL' || fruit.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [fruits, searchTerm, statusFilter]);

    const openAddModal = () => {
        setEditingFruit(null);
        setFormData(emptyForm);
        setError('');
        setModalOpen(true);
    };

    const openEditModal = (fruit) => {
        setEditingFruit(fruit);
        setFormData({
            fruit_name: fruit.fruit_name,
            description: fruit.description || '',
            status: fruit.status
        });
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingFruit(null);
        setFormData(emptyForm);
        setError('');
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData(previous => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.fruit_name.trim()) {
            setError('Please enter a fruit name.');
            return;
        }

        if (formData.fruit_name.trim().length > 50) {
            setError('Fruit name cannot exceed 50 characters.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                fruit_name: formData.fruit_name.trim(),
                description: formData.description.trim(),
                status: formData.status
            };

            if (editingFruit) {
                await updateFruit(editingFruit.fruit_id, payload);
                setSuccess('Fruit updated successfully.');
            } else {
                await createFruit(payload);
                setSuccess('Fruit registered successfully.');
            }

            setModalOpen(false);
            setEditingFruit(null);
            setFormData(emptyForm);

            await fetchFruits();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (fruit) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${fruit.fruit_name}?`
        );

        if (!confirmed) return;

        try {
            setDeletingId(fruit.fruit_id);
            setError('');
            setSuccess('');

            await deleteFruit(fruit.fruit_id);

            setSuccess(`${fruit.fruit_name} deleted successfully.`);
            await fetchFruits();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="fruits-page">
            <div className="fruits-heading">
                <div>
                    <div className="fruits-eyebrow">
                        <Leaf size={15} />
                        PRODUCT CATALOGUE
                    </div>
                    <h1>Fruit Management</h1>
                    <p>Manage your farm's fruit varieties and availability.</p>
                </div>

                <button className="fruit-add-button" onClick={openAddModal}>
                    <Plus size={19} />
                    Add New Fruit
                </button>
            </div>

            {success && (
                <div className="fruit-message fruit-success">
                    <CheckCircle2 size={18} />
                    {success}
                    <button onClick={() => setSuccess('')} aria-label="Dismiss message">
                        <X size={17} />
                    </button>
                </div>
            )}

            {error && !modalOpen && (
                <div className="fruit-message fruit-error">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError('')} aria-label="Dismiss message">
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="fruit-stat-grid">
                <div className="fruit-stat-card">
                    <div className="fruit-stat-icon total">
                        <Apple size={22} />
                    </div>
                    <div>
                        <span>Total Fruit Types</span>
                        <strong>{fruits.length}</strong>
                        <small>Registered varieties</small>
                    </div>
                </div>

                <div className="fruit-stat-card">
                    <div className="fruit-stat-icon available">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <span>Available</span>
                        <strong>{availableCount}</strong>
                        <small>Active fruit varieties</small>
                    </div>
                </div>

                <div className="fruit-stat-card">
                    <div className="fruit-stat-icon unavailable">
                        <XCircle size={22} />
                    </div>
                    <div>
                        <span>Unavailable</span>
                        <strong>{unavailableCount}</strong>
                        <small>Currently unavailable</small>
                    </div>
                </div>
            </div>

            <div className="fruits-toolbar">
                <div className="fruits-search">
                    <Search size={19} />
                    <input
                        type="text"
                        placeholder="Search fruit name or description..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value)}
                    aria-label="Filter by availability"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="UNAVAILABLE">Unavailable</option>
                </select>

                <button
                    className="fruit-refresh-button"
                    onClick={() => fetchFruits(true)}
                    disabled={refreshing}
                    title="Refresh fruits"
                >
                    <RefreshCw size={18} className={refreshing ? 'fruit-spinning' : ''} />
                    Refresh
                </button>
            </div>

            <div className="fruits-table-card">
                <div className="fruits-table-heading">
                    <div>
                        <h2>Registered Fruits</h2>
                        <p>Fruit varieties currently recorded in the system</p>
                    </div>
                    <span className="fruit-record-count">
                        {filteredFruits.length} records
                    </span>
                </div>

                {loading ? (
                    <div className="fruit-empty-state">
                        <RefreshCw className="fruit-spinning" size={28} />
                        <p>Loading fruit records...</p>
                    </div>
                ) : error && fruits.length === 0 ? (
                    <div className="fruit-empty-state">
                        <AlertCircle size={30} />
                        <p>{error}</p>
                        <button onClick={() => fetchFruits()}>Try Again</button>
                    </div>
                ) : filteredFruits.length === 0 ? (
                    <div className="fruit-empty-state">
                        <Apple size={30} />
                        <p>No fruits found.</p>
                        <span>Try changing your search or filter.</span>
                    </div>
                ) : (
                    <div className="fruits-table-wrapper">
                        <table className="fruits-table">
                            <thead>
                                <tr>
                                    <th>Fruit</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Date Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredFruits.map(fruit => (
                                    <tr key={fruit.fruit_id}>
                                        <td>
                                            <div className="fruit-name-cell">
                                                <div className="fruit-row-icon">
                                                    <Apple size={19} />
                                                </div>
                                                <div>
                                                    <strong>{fruit.fruit_name}</strong>
                                                    <small>ID: {fruit.fruit_id}</small>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="fruit-description">
                                            {fruit.description || 'No description provided'}
                                        </td>

                                        <td>
                                            <span className={`fruit-status ${fruit.status.toLowerCase()}`}>
                                                <span />
                                                {fruit.status === 'AVAILABLE' ? 'Available' : 'Unavailable'}
                                            </span>
                                        </td>

                                        <td>
                                            {fruit.created_at
                                                ? new Date(fruit.created_at).toLocaleDateString()
                                                : '—'}
                                        </td>

                                        <td>
                                            <div className="fruit-actions">
                                                <button
                                                    className="fruit-edit-action"
                                                    onClick={() => openEditModal(fruit)}
                                                    title="Edit fruit"
                                                >
                                                    <Pencil size={17} />
                                                </button>

                                                <button
                                                    className="fruit-delete-action"
                                                    onClick={() => handleDelete(fruit)}
                                                    disabled={deletingId === fruit.fruit_id}
                                                    title="Delete fruit"
                                                >
                                                    {deletingId === fruit.fruit_id
                                                        ? <RefreshCw size={17} className="fruit-spinning" />
                                                        : <Trash2 size={17} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fruit-modal-overlay" onClick={closeModal}>
                    <div
                        className="fruit-modal"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="fruit-modal-heading">
                            <div>
                                <span>{editingFruit ? 'UPDATE CATALOGUE' : 'NEW CATALOGUE ENTRY'}</span>
                                <h2>{editingFruit ? 'Edit Fruit' : 'Add New Fruit'}</h2>
                                <p>
                                    {editingFruit
                                        ? 'Update the fruit details and availability.'
                                        : 'Register a new fruit variety in your farm.'}
                                </p>
                            </div>

                            <button onClick={closeModal} aria-label="Close modal">
                                <X size={21} />
                            </button>
                        </div>

                        {error && (
                            <div className="fruit-message fruit-error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <label htmlFor="fruit_name">Fruit Name</label>
                            <input
                                id="fruit_name"
                                name="fruit_name"
                                type="text"
                                maxLength={50}
                                placeholder="e.g. Strawberries"
                                value={formData.fruit_name}
                                onChange={handleInputChange}
                                required
                            />

                            <label htmlFor="fruit_description">Description</label>
                            <textarea
                                id="fruit_description"
                                name="description"
                                rows={3}
                                placeholder="Enter a short description of this fruit..."
                                value={formData.description}
                                onChange={handleInputChange}
                            />

                            <label htmlFor="fruit_status">Availability Status</label>
                            <select
                                id="fruit_status"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                            >
                                <option value="AVAILABLE">Available</option>
                                <option value="UNAVAILABLE">Unavailable</option>
                            </select>

                            <div className="fruit-modal-actions">
                                <button
                                    type="button"
                                    className="fruit-cancel-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="fruit-save-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingFruit
                                            ? 'Save Changes'
                                            : 'Register Fruit'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Fruits;
