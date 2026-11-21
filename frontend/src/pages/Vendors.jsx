
import { useEffect, useMemo, useState } from 'react';
import {
    Users,
    Search,
    RefreshCw,
    Plus,
    Pencil,
    Trash2,
    MapPin,
    Phone,
    CalendarDays,
    X,
    Store
} from 'lucide-react';

import {
    getVendors,
    createVendor,
    updateVendor,
    deleteVendor
} from '../services/api';

import './Vendors.css';

const getToday = () => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    return new Date(today.getTime() - offset * 60000)
        .toISOString()
        .split('T')[0];
};

const emptyForm = {
    vendor_name: '',
    phone_number: '',
    location: '',
    registration_date: getToday()
};

function Vendors() {
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const [modalOpen, setModalOpen] = useState(false);
    const [editingVendor, setEditingVendor] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');

    const fetchVendors = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await getVendors();
            setVendors(response.data || []);
        } catch (err) {
            setError(err.message || 'Unable to retrieve vendors.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const filteredVendors = useMemo(() => {
        const search = searchTerm.toLowerCase().trim();

        return vendors.filter((vendor) => {
            return [
                vendor.vendor_name,
                vendor.phone_number,
                vendor.location
            ].some((value) =>
                (value || '').toLowerCase().includes(search)
            );
        });
    }, [vendors, searchTerm]);

    const openAddModal = () => {
        setEditingVendor(null);
        setFormData(emptyForm);
        setFormError('');
        setModalOpen(true);
    };

    const openEditModal = (vendor) => {
        setEditingVendor(vendor);

        setFormData({
            vendor_name: vendor.vendor_name || '',
            phone_number: vendor.phone_number || '',
            location: vendor.location || '',
            registration_date: vendor.registration_date
                ? vendor.registration_date.split('T')[0]
                : getToday()
        });

        setFormError('');
        setModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setModalOpen(false);
        setEditingVendor(null);
        setFormData(emptyForm);
        setFormError('');
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setFormError('');
        setSuccess('');

        for (const [key, value] of Object.entries(formData)) {
            if (!value.trim()) {
                setFormError('Please complete all required fields.');
                return;
            }
        }

        setSaving(true);

        try {
            if (editingVendor) {
                await updateVendor(editingVendor.vendor_id, formData);
                setSuccess('Vendor details updated successfully.');
            } else {
                await createVendor(formData);
                setSuccess('Vendor registered successfully.');
            }

            setModalOpen(false);
            setEditingVendor(null);
            setFormData(emptyForm);

            await fetchVendors();
        } catch (err) {
            setFormError(err.message || 'Unable to save vendor details.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (vendor) => {
        const confirmed = window.confirm(
            `Are you sure you want to delete ${vendor.vendor_name}?`
        );

        if (!confirmed) return;

        setError('');
        setSuccess('');

        try {
            await deleteVendor(vendor.vendor_id);
            setSuccess('Vendor deleted successfully.');
            await fetchVendors();
        } catch (err) {
            setError(err.message || 'Unable to delete this vendor.');
        }
    };

    const uniqueLocations = new Set(
        vendors.map((vendor) => vendor.location).filter(Boolean)
    ).size;

    return (
        <div className="vendors-page">
            <div className="vendors-heading">
                <div>
                    <span className="eyebrow">BATLOUNG FARM / WORKSPACE</span>
                    <h2>Vendors</h2>
                    <p>Manage your registered vendors and their contact information.</p>
                </div>

                <button className="vendors-primary-button" onClick={openAddModal}>
                    <Plus size={18} />
                    Add vendor
                </button>
            </div>

            <div className="vendors-stats">
                <div className="vendors-stat-card">
                    <div className="vendors-stat-icon">
                        <Users size={21} />
                    </div>
                    <div>
                        <span>Total vendors</span>
                        <strong>{vendors.length}</strong>
                    </div>
                </div>

                <div className="vendors-stat-card">
                    <div className="vendors-stat-icon location">
                        <MapPin size={21} />
                    </div>
                    <div>
                        <span>Locations covered</span>
                        <strong>{uniqueLocations}</strong>
                    </div>
                </div>

                <div className="vendors-stat-card">
                    <div className="vendors-stat-icon registered">
                        <Store size={21} />
                    </div>
                    <div>
                        <span>Registered vendors</span>
                        <strong>{vendors.length}</strong>
                    </div>
                </div>
            </div>

            <div className="vendors-toolbar">
                <div className="vendors-search">
                    <Search size={18} />
                    <input
                        type="search"
                        placeholder="Search vendors by name, phone or location..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                    />
                </div>

                <button
                    className="vendors-refresh-button"
                    onClick={fetchVendors}
                    disabled={loading}
                >
                    <RefreshCw size={17} className={loading ? 'vendors-spinning' : ''} />
                    Refresh
                </button>
            </div>

            {success && (
                <div className="vendors-message success">
                    {success}
                    <button onClick={() => setSuccess('')} aria-label="Dismiss message">
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && (
                <div className="vendors-message error">
                    {error}
                    <button onClick={() => setError('')} aria-label="Dismiss message">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="vendors-table-card">
                <div className="vendors-table-heading">
                    <div>
                        <h3>Vendor directory</h3>
                        <p>{filteredVendors.length} vendor records found</p>
                    </div>
                </div>

                {loading ? (
                    <div className="vendors-state">
                        <RefreshCw size={25} className="vendors-spinning" />
                        <p>Loading vendor records...</p>
                    </div>
                ) : filteredVendors.length === 0 ? (
                    <div className="vendors-state">
                        <Users size={32} />
                        <h3>No vendors found</h3>
                        <p>
                            {searchTerm
                                ? 'Try a different search term.'
                                : 'Add your first vendor to get started.'}
                        </p>
                    </div>
                ) : (
                    <div className="vendors-table-wrapper">
                        <table className="vendors-table">
                            <thead>
                                <tr>
                                    <th>Vendor</th>
                                    <th>Phone number</th>
                                    <th>Location</th>
                                    <th>Registration date</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredVendors.map((vendor) => (
                                    <tr key={vendor.vendor_id}>
                                        <td>
                                            <div className="vendor-name-cell">
                                                <div className="vendor-avatar">
                                                    {vendor.vendor_name?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <strong>{vendor.vendor_name}</strong>
                                                    <span>Vendor #{vendor.vendor_id}</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td>
                                            <span className="vendor-detail">
                                                <Phone size={15} />
                                                {vendor.phone_number}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="vendor-detail">
                                                <MapPin size={15} />
                                                {vendor.location}
                                            </span>
                                        </td>

                                        <td>
                                            <span className="vendor-detail">
                                                <CalendarDays size={15} />
                                                {vendor.registration_date
                                                    ? new Date(vendor.registration_date).toLocaleDateString()
                                                    : '—'}
                                            </span>
                                        </td>

                                        <td>
                                            <div className="vendor-actions">
                                                <button
                                                    className="vendor-action edit"
                                                    onClick={() => openEditModal(vendor)}
                                                    title="Edit vendor"
                                                    aria-label={`Edit ${vendor.vendor_name}`}
                                                >
                                                    <Pencil size={16} />
                                                </button>

                                                <button
                                                    className="vendor-action delete"
                                                    onClick={() => handleDelete(vendor)}
                                                    title="Delete vendor"
                                                    aria-label={`Delete ${vendor.vendor_name}`}
                                                >
                                                    <Trash2 size={16} />
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
                <div className="vendors-modal-overlay" onMouseDown={closeModal}>
                    <div
                        className="vendors-modal"
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="vendors-modal-header">
                            <div>
                                <span className="eyebrow">VENDOR MANAGEMENT</span>
                                <h3>{editingVendor ? 'Edit vendor' : 'Register new vendor'}</h3>
                                <p>
                                    {editingVendor
                                        ? 'Update the vendor information below.'
                                        : 'Enter the details to register a vendor.'}
                                </p>
                            </div>

                            <button
                                className="vendors-modal-close"
                                onClick={closeModal}
                                aria-label="Close modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="vendors-form-group">
                                <label htmlFor="vendor_name">Vendor name</label>
                                <input
                                    id="vendor_name"
                                    name="vendor_name"
                                    value={formData.vendor_name}
                                    onChange={handleChange}
                                    placeholder="Enter vendor or business name"
                                    required
                                    maxLength={150}
                                />
                            </div>

                            <div className="vendors-form-group">
                                <label htmlFor="phone_number">Phone number</label>
                                <input
                                    id="phone_number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="Enter phone number"
                                    required
                                    maxLength={20}
                                />
                            </div>

                            <div className="vendors-form-group">
                                <label htmlFor="location">Location</label>
                                <input
                                    id="location"
                                    name="location"
                                    value={formData.location}
                                    onChange={handleChange}
                                    placeholder="Enter vendor location"
                                    required
                                    maxLength={255}
                                />
                            </div>

                            <div className="vendors-form-group">
                                <label htmlFor="registration_date">Registration date</label>
                                <input
                                    id="registration_date"
                                    name="registration_date"
                                    type="date"
                                    value={formData.registration_date}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {formError && (
                                <div className="vendors-form-error">
                                    {formError}
                                </div>
                            )}

                            <div className="vendors-modal-actions">
                                <button
                                    type="button"
                                    className="vendors-cancel-button"
                                    onClick={closeModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="vendors-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? 'Saving...'
                                        : editingVendor
                                            ? 'Save changes'
                                            : 'Register vendor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Vendors;
