
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    Search,
    RefreshCw,
    Plus,
    X,
    CreditCard,
    Banknote,
    Smartphone,
    Receipt,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

import {
    getPayments,
    createPayment,
    getSales
} from '../services/api';

import './Payments.css';

const emptyForm = {
    sale_id: '',
    payment_method: 'CASH',
    amount_paid: '',
    reference_number: ''
};

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

function Payments() {
    const [payments, setPayments] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(emptyForm);

    const loadData = async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            setError('');

            const [paymentResult, salesResult] = await Promise.all([
                getPayments(),
                getSales()
            ]);

            setPayments(paymentResult.data || []);
            setSales(salesResult.data || []);
        } catch (err) {
            setError(err.message || 'Unable to load payment information.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const paymentTotals = useMemo(() => {
        return payments.reduce((totals, payment) => {
            const saleId = Number(payment.sale_id);
            totals[saleId] = (totals[saleId] || 0) +
                Number(payment.amount_paid || 0);

            return totals;
        }, {});
    }, [payments]);

    const getOutstanding = (sale) => {
        const total = Number(sale.total_amount || 0);
        const paid = paymentTotals[Number(sale.sale_id)] || 0;

        return Math.max(0, total - paid);
    };

    const outstandingSales = useMemo(() => {
        return sales.filter((sale) => getOutstanding(sale) > 0.009);
    }, [sales, paymentTotals]);

    const totalReceived = useMemo(() => {
        return payments.reduce(
            (total, payment) => total + Number(payment.amount_paid || 0),
            0
        );
    }, [payments]);

    const totalOutstanding = useMemo(() => {
        return sales.reduce(
            (total, sale) => total + getOutstanding(sale),
            0
        );
    }, [sales, paymentTotals]);

    const paidSales = sales.filter(
        (sale) => getOutstanding(sale) <= 0.009
    ).length;

    const filteredPayments = useMemo(() => {
        const query = search.toLowerCase().trim();

        if (!query) return payments;

        return payments.filter((payment) =>
            String(payment.payment_id).includes(query) ||
            String(payment.sale_id).includes(query) ||
            String(payment.payment_method).toLowerCase().includes(query) ||
            String(payment.reference_number || '').toLowerCase().includes(query) ||
            String(payment.amount_paid).includes(query)
        );
    }, [payments, search]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const handleOpenModal = () => {
        setForm(emptyForm);
        setError('');
        setSuccess('');
        setShowModal(true);
    };

    const handleCloseModal = () => {
        if (!saving) {
            setShowModal(false);
            setForm(emptyForm);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const amount = Number(form.amount_paid);
        const saleId = Number(form.sale_id);

        if (!saleId || !form.amount_paid || !Number.isFinite(amount) || amount <= 0) {
            setError('Select a sale and enter a valid payment amount.');
            return;
        }

        const selectedSale = sales.find(
            (sale) => Number(sale.sale_id) === saleId
        );

        if (!selectedSale) {
            setError('Please select a valid sale.');
            return;
        }

        const outstanding = getOutstanding(selectedSale);

        if (amount > outstanding + 0.001) {
            setError(
                `The payment cannot exceed the outstanding balance of ${formatMoney(outstanding)}.`
            );
            return;
        }

        try {
            setSaving(true);
            setError('');

            const paymentData = {
                sale_id: saleId,
                payment_method: form.payment_method,
                amount_paid: amount,
                ...(form.reference_number.trim()
                    ? { reference_number: form.reference_number.trim() }
                    : {})
            };

            const result = await createPayment(paymentData);

            setSuccess(result.message || 'Payment recorded successfully.');
            setShowModal(false);
            setForm(emptyForm);

            await loadData(true);
        } catch (err) {
            setError(err.message || 'Unable to record payment.');
        } finally {
            setSaving(false);
        }
    };

    const selectedSale = sales.find(
        (sale) => Number(sale.sale_id) === Number(form.sale_id)
    );

    const selectedOutstanding = selectedSale
        ? getOutstanding(selectedSale)
        : 0;

    return (
        <div className="payments-page">
            <div className="payments-heading">
                <div>
                    <span className="payments-eyebrow">FINANCIAL MANAGEMENT</span>
                    <h1>Payments</h1>
                    <p>Track payments, monitor outstanding balances and manage collections.</p>
                </div>

                <button
                    className="payments-primary-btn"
                    onClick={handleOpenModal}
                    disabled={outstandingSales.length === 0}
                >
                    <Plus size={19} />
                    Record Payment
                </button>
            </div>

            {error && !showModal && (
                <div className="payments-alert error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {success && (
                <div className="payments-alert success">
                    <CheckCircle2 size={18} />
                    {success}
                    <button onClick={() => setSuccess('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="payments-stats">
                <motion.div
                    className="payment-stat-card"
                    whileHover={{ y: -4 }}
                >
                    <div className="payment-stat-icon green">
                        <Wallet size={22} />
                    </div>
                    <div>
                        <span>Total Received</span>
                        <h2>{formatMoney(totalReceived)}</h2>
                        <p>All recorded payments</p>
                    </div>
                </motion.div>

                <motion.div
                    className="payment-stat-card"
                    whileHover={{ y: -4 }}
                >
                    <div className="payment-stat-icon gold">
                        <Receipt size={22} />
                    </div>
                    <div>
                        <span>Outstanding Balance</span>
                        <h2>{formatMoney(totalOutstanding)}</h2>
                        <p>Money still owed</p>
                    </div>
                </motion.div>

                <motion.div
                    className="payment-stat-card"
                    whileHover={{ y: -4 }}
                >
                    <div className="payment-stat-icon blue">
                        <CreditCard size={22} />
                    </div>
                    <div>
                        <span>Payment Records</span>
                        <h2>{payments.length}</h2>
                        <p>Transactions recorded</p>
                    </div>
                </motion.div>

                <motion.div
                    className="payment-stat-card"
                    whileHover={{ y: -4 }}
                >
                    <div className="payment-stat-icon purple">
                        <CheckCircle2 size={22} />
                    </div>
                    <div>
                        <span>Fully Paid Sales</span>
                        <h2>{paidSales}</h2>
                        <p>Sales settled in full</p>
                    </div>
                </motion.div>
            </div>

            <div className="payments-table-panel">
                <div className="payments-table-heading">
                    <div>
                        <h2>Payment History</h2>
                        <p>Review all payments received from sales.</p>
                    </div>

                    <button
                        className="payments-refresh-btn"
                        onClick={() => loadData(true)}
                        disabled={refreshing}
                        title="Refresh payments"
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? 'spinning' : ''}
                        />
                        Refresh
                    </button>
                </div>

                <div className="payments-toolbar">
                    <div className="payments-search">
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Search payment, sale, method or reference..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />
                    </div>

                    <span className="payments-record-count">
                        {filteredPayments.length} records
                    </span>
                </div>

                {loading ? (
                    <div className="payments-state">
                        <RefreshCw className="spinning" size={25} />
                        <p>Loading payments...</p>
                    </div>
                ) : error && payments.length === 0 ? (
                    <div className="payments-state error-text">
                        <AlertCircle size={27} />
                        <p>{error}</p>
                        <button onClick={() => loadData(true)}>Try Again</button>
                    </div>
                ) : filteredPayments.length === 0 ? (
                    <div className="payments-state">
                        <Wallet size={32} />
                        <h3>No payment records found</h3>
                        <p>Recorded payments will appear here.</p>
                    </div>
                ) : (
                    <div className="payments-table-wrapper">
                        <table className="payments-table">
                            <thead>
                                <tr>
                                    <th>Payment ID</th>
                                    <th>Sale ID</th>
                                    <th>Payment Date</th>
                                    <th>Payment Method</th>
                                    <th>Reference</th>
                                    <th>Amount Paid</th>
                                    <th>Sale Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredPayments.map((payment) => (
                                    <tr key={payment.payment_id}>
                                        <td className="payment-id">
                                            #{payment.payment_id}
                                        </td>
                                        <td>#{payment.sale_id}</td>
                                        <td>{formatDate(payment.payment_date)}</td>
                                        <td>
                                            <span className="payment-method">
                                                {payment.payment_method === 'CASH' ? (
                                                    <Banknote size={15} />
                                                ) : payment.payment_method === 'MOBILE_MONEY' ? (
                                                    <Smartphone size={15} />
                                                ) : (
                                                    <CreditCard size={15} />
                                                )}
                                                {payment.payment_method.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>{payment.reference_number || '—'}</td>
                                        <td className="payment-amount">
                                            {formatMoney(payment.amount_paid)}
                                        </td>
                                        <td>
                                            <span className={`payment-status ${String(payment.payment_status).toLowerCase()}`}>
                                                {String(payment.payment_status).replace('_', ' ')}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="outstanding-panel">
                <div className="outstanding-heading">
                    <div>
                        <h2>Outstanding Sales</h2>
                        <p>Sales with balances that are still awaiting payment.</p>
                    </div>
                    <span>{outstandingSales.length} outstanding</span>
                </div>

                {outstandingSales.length === 0 ? (
                    <div className="payments-empty-outstanding">
                        <CheckCircle2 size={24} />
                        <p>All sales have been fully paid.</p>
                    </div>
                ) : (
                    <div className="outstanding-list">
                        {outstandingSales.map((sale) => (
                            <div className="outstanding-item" key={sale.sale_id}>
                                <div>
                                    <strong>Sale #{sale.sale_id}</strong>
                                    <span>{sale.vendor_name || 'Vendor'} · {formatDate(sale.sale_date)}</span>
                                </div>

                                <div className="outstanding-amount">
                                    <strong>{formatMoney(getOutstanding(sale))}</strong>
                                    <span>Outstanding</span>
                                </div>

                                <button
                                    className="outstanding-pay-btn"
                                    onClick={() => {
                                        setForm({
                                            ...emptyForm,
                                            sale_id: String(sale.sale_id)
                                        });
                                        setError('');
                                        setShowModal(true);
                                    }}
                                >
                                    Pay
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="payments-modal-overlay" onClick={handleCloseModal}>
                    <div
                        className="payments-modal"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="payments-modal-heading">
                            <div>
                                <span className="payments-eyebrow">COLLECTION</span>
                                <h2>Record Payment</h2>
                                <p>Enter the details of the payment received.</p>
                            </div>

                            <button
                                className="payments-close-btn"
                                onClick={handleCloseModal}
                                disabled={saving}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        {error && (
                            <div className="payments-alert error">
                                <AlertCircle size={17} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="payment-form-group">
                                <label htmlFor="payment-sale">Select Sale</label>
                                <select
                                    id="payment-sale"
                                    name="sale_id"
                                    value={form.sale_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Choose a sale</option>
                                    {outstandingSales.map((sale) => (
                                        <option
                                            key={sale.sale_id}
                                            value={sale.sale_id}
                                        >
                                            Sale #{sale.sale_id} — {sale.vendor_name || 'Vendor'} — {formatMoney(getOutstanding(sale))} due
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedSale && (
                                <div className="payment-balance-preview">
                                    <div>
                                        <span>Sale Total</span>
                                        <strong>{formatMoney(selectedSale.total_amount)}</strong>
                                    </div>
                                    <div>
                                        <span>Already Paid</span>
                                        <strong>
                                            {formatMoney(paymentTotals[selectedSale.sale_id] || 0)}
                                        </strong>
                                    </div>
                                    <div className="balance-due">
                                        <span>Outstanding</span>
                                        <strong>{formatMoney(selectedOutstanding)}</strong>
                                    </div>
                                </div>
                            )}

                            <div className="payment-form-group">
                                <label htmlFor="payment-method">Payment Method</label>
                                <select
                                    id="payment-method"
                                    name="payment_method"
                                    value={form.payment_method}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="MOBILE_MONEY">Mobile Money</option>
                                    <option value="CREDIT">Credit</option>
                                </select>
                            </div>

                            <div className="payment-form-group">
                                <label htmlFor="payment-amount">Amount Paid (M)</label>
                                <input
                                    id="payment-amount"
                                    name="amount_paid"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    max={selectedSale ? selectedOutstanding : undefined}
                                    placeholder="Enter amount"
                                    value={form.amount_paid}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="payment-form-group">
                                <label htmlFor="payment-reference">
                                    Reference Number <span>(Optional)</span>
                                </label>
                                <input
                                    id="payment-reference"
                                    name="reference_number"
                                    type="text"
                                    maxLength="100"
                                    placeholder="Enter transaction reference"
                                    value={form.reference_number}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="payments-form-actions">
                                <button
                                    type="button"
                                    className="payments-cancel-btn"
                                    onClick={handleCloseModal}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="payments-primary-btn"
                                    disabled={saving || outstandingSales.length === 0}
                                >
                                    {saving ? 'Recording...' : 'Record Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Payments;
