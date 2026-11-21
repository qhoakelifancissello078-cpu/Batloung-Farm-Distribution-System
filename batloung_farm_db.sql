
CREATE DATABASE IF NOT EXISTS batloung_farm_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE batloung_farm_db;
SHOW DATABASES;
SELECT DATABASE();
describe suppliers;
SHOW COLUMNS FROM suppliers LIKE 'province';
SELECT *
FROM suppliers
ORDER BY supplier_id DESC
LIMIT 1;
SELECT *
FROM suppliers
WHERE supplier_id = 18;
SELECT
    s.supplier_id,
    s.business_name,
    COUNT(p.purchase_id) AS purchase_count
FROM suppliers s
LEFT JOIN purchases p
    ON s.supplier_id = p.supplier_id
GROUP BY s.supplier_id, s.business_name
ORDER BY purchase_count DESC;
SELECT
    sale_id,
    total_amount,
    payment_status
FROM sales
WHERE sale_id = 3;

SELECT
    payment_id,
    sale_id,
    payment_method,
    amount_paid,
    reference_number
FROM payments
WHERE sale_id = 3
ORDER BY payment_id;