
USE batloung_farm_db;

-- 1. SUPPLIERS
CREATE TABLE suppliers (
    supplier_id INT AUTO_INCREMENT PRIMARY KEY,
    business_name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    province ENUM(
        'Gauteng',
        'Free State',
        'KwaZulu-Natal',
        'Western Cape',
        'Eastern Cape',
        'Limpopo',
        'Mpumalanga',
        'North West'
    ) NOT NULL,
    address VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (phone)
);

-- 2. FRUITS
CREATE TABLE fruits (
    fruit_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('AVAILABLE', 'UNAVAILABLE')
        NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. VENDORS
CREATE TABLE vendors (
    vendor_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_name VARCHAR(150) NOT NULL,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(255) NOT NULL,
    registration_date DATE NOT NULL
);

-- 4. PURCHASES
CREATE TABLE purchases (
    purchase_id INT AUTO_INCREMENT PRIMARY KEY,
    supplier_id INT NOT NULL,
    purchase_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_purchase_supplier
        FOREIGN KEY (supplier_id)
        REFERENCES suppliers(supplier_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_purchase_total
        CHECK (total_amount >= 0)
);

-- 5. PURCHASE DETAILS
CREATE TABLE purchase_details (
    purchase_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    purchase_id INT NOT NULL,
    fruit_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,

    CONSTRAINT fk_pd_purchase
        FOREIGN KEY (purchase_id)
        REFERENCES purchases(purchase_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_pd_fruit
        FOREIGN KEY (fruit_id)
        REFERENCES fruits(fruit_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_pd_quantity CHECK (quantity > 0),
    CONSTRAINT chk_pd_cost CHECK (unit_cost >= 0)
);

-- 6. SALES
CREATE TABLE sales (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_id INT NOT NULL,
    sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payment_status ENUM(
        'PAID',
        'PARTIALLY_PAID',
        'UNPAID'
    ) NOT NULL DEFAULT 'UNPAID',
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    CONSTRAINT fk_sale_vendor
        FOREIGN KEY (vendor_id)
        REFERENCES vendors(vendor_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_sale_total
        CHECK (total_amount >= 0)
);

-- 7. SALES DETAILS
CREATE TABLE sales_details (
    sales_detail_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    fruit_id INT NOT NULL,
    packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_sd_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_sd_fruit
        FOREIGN KEY (fruit_id)
        REFERENCES fruits(fruit_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_sd_quantity CHECK (quantity > 0),
    CONSTRAINT chk_sd_price CHECK (unit_price >= 0)
);

-- 8. STOCK
CREATE TABLE stock (
    stock_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_id INT NOT NULL,
    packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
    available_quantity INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_stock_fruit
        FOREIGN KEY (fruit_id)
        REFERENCES fruits(fruit_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_fruit_packaging
        UNIQUE (fruit_id, packaging_size),

    CONSTRAINT chk_stock_quantity
        CHECK (available_quantity >= 0)
);

-- 9. SELLING PRICES
CREATE TABLE selling_prices (
    price_id INT AUTO_INCREMENT PRIMARY KEY,
    fruit_id INT NOT NULL,
    packaging_size ENUM('SMALL', 'MEDIUM', 'LARGE') NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_price_fruit
        FOREIGN KEY (fruit_id)
        REFERENCES fruits(fruit_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT uq_fruit_selling_price
        UNIQUE (fruit_id, packaging_size),

    CONSTRAINT chk_selling_price
        CHECK (selling_price > 0)
);

CREATE TABLE payments (
    payment_id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    payment_method ENUM(
        'CASH',
        'MOBILE_MONEY',
        'CREDIT'
    ) NOT NULL,
    amount_paid DECIMAL(12,2) NOT NULL,
    payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reference_number VARCHAR(100),

    CONSTRAINT fk_payment_sale
        FOREIGN KEY (sale_id)
        REFERENCES sales(sale_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT chk_payment_amount
        CHECK (amount_paid > 0),

    INDEX idx_payment_sale (sale_id)
);