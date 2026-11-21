
USE batloung_farm_db;

INSERT IGNORE INTO suppliers
(business_name, contact_person, phone, province, address)
VALUES
('Johannesburg Fresh Produce', 'Thabo Mokoena', '+27110000001', 'Gauteng', 'Johannesburg, South Africa'),
('Free State Fruit Traders', 'Pieter Botha', '+27510000002', 'Free State', 'Bloemfontein, South Africa'),
('Durban Fruit Wholesale', 'Sipho Dlamini', '+27310000003', 'KwaZulu-Natal', 'Durban, South Africa'),
('Cape Fresh Suppliers', 'James Williams', '+27210000004', 'Western Cape', 'Cape Town, South Africa'),
('Eastern Produce Distributors', 'Lutho Mbeki', '+27410000005', 'Eastern Cape', 'Gqeberha, South Africa'),
('Limpopo Fruit Market', 'Kabelo Nkuna', '+27150000006', 'Limpopo', 'Polokwane, South Africa'),
('Mpumalanga Fresh Fruits', 'Mandla Nkosi', '+27130000007', 'Mpumalanga', 'Nelspruit, South Africa'),
('North West Fruit Supply', 'Kagiso Molefe', '+27180000008', 'North West', 'Rustenburg, South Africa');


INSERT IGNORE INTO fruits
(fruit_name, description, status)
VALUES
('Apples', 'Fresh red and green apples', 'AVAILABLE'),
('Bananas', 'Fresh ripe yellow bananas', 'AVAILABLE'),
('Oranges', 'Fresh citrus oranges', 'AVAILABLE'),
('Mangoes', 'Fresh seasonal mangoes', 'AVAILABLE'),
('Grapes', 'Fresh seedless and seeded grapes', 'AVAILABLE');


INSERT IGNORE INTO vendors
(vendor_name, phone_number, location, registration_date)
VALUES
('Maseru Street Vendors', '+26662000001', 'Maseru CBD', '2026-11-01'),
('Leribe Fresh Market', '+26662000002', 'Hlotse, Leribe', '2026-11-02'),
('Maputsoe Fruit Traders', '+26662000003', 'Maputsoe', '2026-11-03'),
('Berea Retail Supplies', '+26662000004', 'Teyateyaneng, Berea', '2026-11-04'),
('Mafeteng Small Retailers', '+26662000005', 'Mafeteng', '2026-11-05');


INSERT IGNORE INTO stock
(fruit_id, packaging_size, available_quantity)
SELECT
    f.fruit_id,
    p.packaging_size,
    p.initial_quantity
FROM fruits f
CROSS JOIN (
    SELECT 'SMALL' AS packaging_size, 40 AS initial_quantity
    UNION ALL
    SELECT 'MEDIUM', 25
    UNION ALL
    SELECT 'LARGE', 10
) p;


INSERT IGNORE INTO selling_prices
(fruit_id, packaging_size, selling_price)
SELECT
    f.fruit_id,
    p.packaging_size,
    p.selling_price
FROM fruits f
JOIN (
    SELECT 'Apples' AS fruit_name, 'SMALL' AS packaging_size, 45.00 AS selling_price
    UNION ALL SELECT 'Apples', 'MEDIUM', 80.00
    UNION ALL SELECT 'Apples', 'LARGE', 140.00

    UNION ALL SELECT 'Bananas', 'SMALL', 35.00
    UNION ALL SELECT 'Bananas', 'MEDIUM', 65.00
    UNION ALL SELECT 'Bananas', 'LARGE', 110.00

    UNION ALL SELECT 'Oranges', 'SMALL', 40.00
    UNION ALL SELECT 'Oranges', 'MEDIUM', 75.00
    UNION ALL SELECT 'Oranges', 'LARGE', 130.00

    UNION ALL SELECT 'Mangoes', 'SMALL', 50.00
    UNION ALL SELECT 'Mangoes', 'MEDIUM', 90.00
    UNION ALL SELECT 'Mangoes', 'LARGE', 160.00

    UNION ALL SELECT 'Grapes', 'SMALL', 55.00
    UNION ALL SELECT 'Grapes', 'MEDIUM', 100.00
    UNION ALL SELECT 'Grapes', 'LARGE', 175.00
) p ON f.fruit_name = p.fruit_name;
