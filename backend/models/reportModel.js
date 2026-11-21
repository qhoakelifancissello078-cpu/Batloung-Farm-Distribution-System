
const { pool } = require('../config/db');

const getAllReports = async () => {
    const [stockReport] = await pool.execute(
        `SELECT
            f.fruit_id,
            f.fruit_name,
            f.status AS fruit_status,
            st.packaging_size,
            st.available_quantity
         FROM fruits f
         INNER JOIN stock st ON f.fruit_id = st.fruit_id
         ORDER BY f.fruit_name, st.packaging_size`
    );


    const [purchaseReport] = await pool.execute(
        `SELECT
            p.purchase_id,
            p.purchase_date,
            s.business_name AS supplier_name,
            f.fruit_name,
            pd.packaging_size,
            pd.quantity,
            pd.unit_cost,
            (pd.quantity * pd.unit_cost) AS item_total
         FROM purchases p
         INNER JOIN suppliers s ON p.supplier_id = s.supplier_id
         INNER JOIN purchase_details pd
            ON p.purchase_id = pd.purchase_id
         INNER JOIN fruits f ON pd.fruit_id = f.fruit_id
         ORDER BY p.purchase_date DESC, p.purchase_id`
    );

    const [salesReport] = await pool.execute(
        `SELECT
            s.sale_id,
            s.sale_date,
            v.vendor_name,
            f.fruit_name,
            sd.packaging_size,
            sd.quantity,
            sd.unit_price,
            (sd.quantity * sd.unit_price) AS item_total,
            s.total_amount AS sale_total,
            s.payment_status
         FROM sales s
         INNER JOIN vendors v ON s.vendor_id = v.vendor_id
         INNER JOIN sales_details sd ON s.sale_id = sd.sale_id
         INNER JOIN fruits f ON sd.fruit_id = f.fruit_id
         ORDER BY s.sale_date DESC, s.sale_id`
    );


    const [outstandingReport] = await pool.execute(
        `SELECT
            s.sale_id,
            v.vendor_name,
            s.sale_date,
            s.total_amount,
            COALESCE(SUM(p.amount_paid), 0.00) AS total_paid,
            GREATEST(
                s.total_amount - COALESCE(SUM(p.amount_paid), 0.00),
                0.00
            ) AS outstanding_balance,
            s.payment_status
         FROM sales s
         INNER JOIN vendors v ON s.vendor_id = v.vendor_id
         LEFT JOIN payments p ON s.sale_id = p.sale_id
         GROUP BY
            s.sale_id,
            v.vendor_name,
            s.sale_date,
            s.total_amount,
            s.payment_status
         HAVING outstanding_balance > 0
         ORDER BY outstanding_balance DESC`
    );


    const [performanceReport] = await pool.execute(
        `SELECT
            (SELECT COUNT(*) FROM purchases) AS total_purchases,

            (SELECT COALESCE(SUM(total_amount), 0.00)
             FROM purchases) AS purchase_value,

            (SELECT COUNT(*) FROM sales) AS total_sales,

            (SELECT COALESCE(SUM(total_amount), 0.00)
             FROM sales) AS sales_revenue,

            (SELECT COALESCE(SUM(amount_paid), 0.00)
             FROM payments) AS payments_received,

            (SELECT COALESCE(SUM(outstanding), 0.00)
             FROM (
                SELECT
                    GREATEST(
                        s.total_amount - COALESCE(
                            (SELECT SUM(p.amount_paid)
                             FROM payments p
                             WHERE p.sale_id = s.sale_id),
                            0.00
                        ),
                        0.00
                    ) AS outstanding
                FROM sales s
             ) AS balances
            ) AS total_outstanding`
    );


    return {
        stockReport,
        purchaseReport,
        salesReport,
        outstandingReport,
        performanceReport: performanceReport[0]
    };
};


module.exports = {
    getAllReports
};
