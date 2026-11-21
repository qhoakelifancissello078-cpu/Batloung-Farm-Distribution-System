
import { useEffect, useMemo, useState } from 'react';
import {
    Plus,
    Search,
    RefreshCw,
    Pencil,
    Trash2,
    X,
    CheckCircle2,
    Building2,
    Users,
    MapPin,
    Phone,
    AlertCircle
} from 'lucide-react';

import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier
} from '../services/api';

import './Suppliers.css';

const provinces = [
    'Gauteng',
    'Free State',
    'KwaZulu-Natal',
    'Western Cape',
    'Eastern Cape',
    'Limpopo',
    'Mpumalanga',
    'North West'
];

const emptyForm = {
    business_name: '',
    contact_person: '',
    phone: '',
    province: '',
    address: ''
};

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [provinceFilter, setProvinceFilter] = useState('ALL');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState(emptyForm);

    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchSuppliers = async (showRefresh = false) => {
        try {
            if (showRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            const response = await getSuppliers();
            setSuppliers(response.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const filteredSuppliers = useMemo(() => {
        return suppliers.filter(supplier => {
            const search = searchTerm.toLowerCase();

            const matchesSearch = [
                supplier.business_name,
                supplier.contact_person,
                supplier.phone,
                supplier.province,
                supplier.address
            ].some(value => (value || '').toLowerCase().includes(search));

            const matchesProvince =
                provinceFilter === 'ALL' ||
                supplier.province === provinceFilter;

            return matchesSearch && matchesProvince;
        });
    }, [suppliers, searchTerm, provinceFilter]);

    const openAddModal = () => {
        setEditingSupplier(null);
        setFormData(emptyForm);
        setError('');
        setModalOpen(true);
    };

    const openEditModal = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            business_name: supplier.business_name,
            contact_person: supplier.contact_person,
            phone: supplier.phone,
            province: supplier.province,
            address: supplier.address
        });
        setError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingSupplier(null);
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

        for (const [field, value] of Object.entries(formData)) {
            if (!value.trim()) {
                setError(`Please complete the ${field.replace('_', ' ')} field.`);
                return;
            }
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                business_name: formData.business_name.trim(),
                contact_person: formData.contact_person.trim(),
                phone: formData.phone.trim(),
                province: formData.province,
                address: formData.address.trim()
            };

            if (editingSupplier) {
                await updateSupplier(editingSupplier.supplier_id, payload);
                setSuccess('Supplier updated successfully.');
            } else {
                await createSupplier(payload);
                setSuccess('Supplier registered successfully.');
            }

            setModalOpen(false);
            setEditingSupplier(null);
            setFormData(emptyForm);

            await fetchSuppliers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (supplier) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${supplier.business_name}?`
        );

        if (!confirmed) return;

        try {
            setDeletingId(supplier.supplier_id);
            setError('');
            setSuccess('');

            await deleteSupplier(supplier.supplier_id);

            setSuccess(`${supplier.business_name} deleted successfully.`);
            await fetchSuppliers();
        } catch (err) {
            setError(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="suppliers-page">
            <div className="suppliers-heading">
                <div>
                    <div className="suppliers-eyebrow">
                        <Building2 size={15} />
                        SUPPLIER DIRECTORY
                    </div>
                    <h1>Supplier Management</h1>
                    <p>Manage supplier businesses and their contact information.</p>
                </div>

                <button className="supplier-add-button" onClick={openAddModal}>
                    <Plus size={19} />
                    Add New Supplier
                </button>
            </div>

            {success && (
                <div className="supplier-message supplier-success">
                    <CheckCircle2 size={18} />
                    {success}
                    <button onClick={() => setSuccess('')} aria-label="Dismiss message">
                        <X size={17} />
                    </button>
                </div>
            )}

            {error && !modalOpen && (
                <div className="supplier-message supplier-error">
                    <AlertCircle size={18} />
                    {error}
                    <button onClick={() => setError('')} aria-label="Dismiss message">
                        <X size={17} />
                    </button>
                </div>
            )}

            <div className="supplier-stat-grid">
                <div className="supplier-stat-card">
                    <div className="supplier-stat-icon">
                        <Building2 size={22} />
                    </div>
                    <div>
                        <span>Total Suppliers</span>
                        <strong>{suppliers.length}</strong>
                        <small>Registered businesses</small>
                    </div>
                </div>

                <div className="supplier-stat-card">
                    <div className="supplier-stat-icon contacts">
                        <Users size={22} />
                    </div>
                    <div>
                        <span>Contact Persons</span>
                        <strong>{suppliers.length}</strong>
                        <small>Supplier representatives</small>
                    </div>
                </div>

                <div className="supplier-stat-card">
                    <div className="supplier-stat-icon locations">
                        <MapPin size={22} />
                    </div>
                    <div>
                        <span>Provinces Covered</span>
                        <strong>{new Set(suppliers.map(item => item.province)).size}</strong>
                        <small>Across South Africa</small>
                    </div>
                </div>
            </div>

            <div className="suppliers-toolbar">
                <div className="suppliers-search">
                    <Search size={19} />
                    <input
                        type="text"
                        placeholder="Search business, contact, phone or location..."
                        value={searchTerm}
                        onChange={event => setSearchTerm(event.target.value)}
                    />
                </div>

                <select
                    value={provinceFilter}
                    onChange={event => setProvinceFilter(event.target.value)}
                    aria-label="Filter by province"
                >
                    <option value="ALL">All Provinces</option>
                    {provinces.map(province => (
                        <option key={province} value={province}>
                            {province}
                        </option>
                    ))}
                </select>

                <button
                    className="supplier-refresh-button"
                    onClick={() => fetchSuppliers(true)}
                    disabled={refreshing}
                >
                    <RefreshCw
                        size={18}
                        className={refreshing ? 'supplier-spinning' : ''}
                    />
                    Refresh
                </button>
            </div>

            <div className="suppliers-table-card">
                <div className="suppliers-table-heading">
                    <div>
                        <h2>Registered Suppliers</h2>
                        <p>Businesses supplying produce to Batloung Farm</p>
                    </div>
                    <span>{filteredSuppliers.length} records</span>
                </div>

                {loading ? (
                    <div className="supplier-empty-state">
                        <RefreshCw size={28} className="supplier-spinning" />
                        <p>Loading supplier records...</p>
                    </div>
                ) : error && suppliers.length === 0 ? (
                    <div className="supplier-empty-state">
                        <AlertCircle size={30} />
                        <p>{error}</p>
                        <button onClick={() => fetchSuppliers()}>Try Again</button>
                    </div>
                ) : filteredSuppliers.length === 0 ? (
                    <div className="supplier-empty-state">
                        <Building2 size={30} />
                        <p>No suppliers found.</p>
                        <span>Try changing your search or province filter.</span>
                    </div>
                ) : (
                    <div className="suppliers-table-wrapper">
                        <table className="suppliers-table">
                            <thead>
                                <tr>
                                    <th>Business</th>
                                    <th>Contact Person</th>
                                    <th>Phone Number</th>
                                    <th>Province</th>
                                    <th>Address</th>
                                    <th>Date Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSuppliers.map(supplier => (
                                    <tr key={supplier.supplier_id}>
                                        <td>
                                            <div className="supplier-business-cell">
                                                <div className="supplier-business-icon">
                                                    <Building2 size={19} />
                                                </div>
                                                <div>
                                                    <strong>{supplier.business_name}</strong>
                                                    <small>ID: {supplier.supplier_id}</small>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{supplier.contact_person}</td>
                                        <td>
                                            <span className="supplier-phone">
                                                <Phone size={14} />
                                                {supplier.phone}
                                            </span>
                                        </td>
                                        <td>{supplier.province}</td>
                                        <td className="supplier-address">{supplier.address}</td>
                                        <td>
                                            {supplier.created_at
                                                ? new Date(supplier.created_at).toLocaleDateString()
                                                : '—'}
                                        </td>
                                        <td>
                                            <div className="supplier-actions">
                                                <button
                                                    className="supplier-edit-action"
                                                    onClick={() => openEditModal(supplier)}
                                                    title="Edit supplier"
                                                >
                                                    <Pencil size={17} />
                                                </button>
                                                <button
                                                    className="supplier-delete-action"
                                                    onClick={() => handleDelete(supplier)}
                                                    disabled={deletingId === supplier.supplier_id}
                                                    title="Delete supplier"
                                                >
                                                    {deletingId === supplier.supplier_id
                                                        ? <RefreshCw size={17} className="supplier-spinning" />
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
                <div className="supplier-modal-overlay" onClick={closeModal}>
                    <div
                        className="supplier-modal"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="supplier-modal-heading">
                            <div>
                                <span>{editingSupplier ? 'UPDATE DIRECTORY' : 'NEW DIRECTORY ENTRY'}</span>
                                <h2>{editingSupplier ? 'Edit Supplier' : 'Register Supplier'}</h2>
                                <p>
                                    {editingSupplier
                                        ? 'Update this supplier’s business and contact details.'
                                        : 'Enter the details of the new supplier business.'}
                                </p>
                            </div>
                            <button onClick={closeModal} aria-label="Close modal">
                                <X size={21} />
                            </button>
                        </div>

                        {error && (
                            <div className="supplier-message supplier-error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <label htmlFor="business_name">Business Name</label>
                            <input
                                id="business_name"
                                name="business_name"
                                value={formData.business_name}
                                onChange={handleInputChange}
                                maxLength={150}
                                placeholder="e.g. Maseru Fresh Produce"
                                required
                            />

                            <label htmlFor="contact_person">Contact Person</label>
                            <input
                                id="contact_person"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleInputChange}
                                maxLength={100}
                                placeholder="Full name of contact person"
                                required
                            />

                            <label htmlFor="phone">Phone Number</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleInputChange}
                                maxLength={20}
                                placeholder="e.g. +27110000001"
                                required
                            />

                            <label htmlFor="province">Province</label>
                            <select
                                id="province"
                                name="province"
                                value={formData.province}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">Select province</option>
                                {provinces.map(province => (
                                    <option key={province} value={province}>
                                        {province}
                                    </option>
                                ))}
                            </select>

                            <label htmlFor="address">Business Address</label>
                            <textarea
                                id="address"
                                name="address"
                                rows={2}
                                value={formData.address}
                                onChange={handleInputChange}
                                maxLength={255}
                                placeholder="Enter business location and address"
                                required
                            />

                            <div className="supplier-modal-actions">
                                <button
                                    type="button"
                                    className="supplier-cancel-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="supplier-save-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingSupplier
                                            ? 'Save Changes'
                                            : 'Register Supplier'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Suppliers;
