-- ============================================================================
-- Financial Analytics Course — PostgreSQL schema for Module 3.5
-- Loads the SAME data learners already know from pandas, now as tables.
-- Target: hosted free-tier Postgres (Neon/Supabase) or local PostgreSQL 14+.
-- ============================================================================

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS nifty_prices CASCADE;
DROP TABLE IF EXISTS stock_prices CASCADE;
DROP TABLE IF EXISTS company_financials CASCADE;

-- Clients: the dimension table (1,000 rows)
CREATE TABLE clients (
    client_id            VARCHAR(12) PRIMARY KEY,
    onboard_date         DATE,
    city                 VARCHAR(40),
    segment              VARCHAR(20),
    risk_profile         VARCHAR(20),          -- NULLs present (28) - intentional
    aum_inr              NUMERIC(16,2),        -- NULLs present (6)  - intentional
    products_held        SMALLINT,
    tenure_months        SMALLINT,
    sip_active           SMALLINT,
    relationship_manager VARCHAR(10),
    churned              SMALLINT
);

-- Transactions: the fact table (5,060 rows, deliberately dirty)
-- NOTE txn_date is VARCHAR *on purpose* - it holds three different date formats.
-- Cleaning it into a DATE is a Module 3.5 exercise.
CREATE TABLE transactions (
    txn_id       VARCHAR(16),
    txn_date     VARCHAR(20),
    customer_id  VARCHAR(12),                  -- joins to clients.client_id
    merchant     VARCHAR(60),
    category     VARCHAR(40),
    mode         VARCHAR(20),
    amount_inr   NUMERIC(14,2),
    city         VARCHAR(40)
);

CREATE TABLE nifty_prices (
    trade_date DATE PRIMARY KEY,
    open       NUMERIC(12,2),
    high       NUMERIC(12,2),
    low        NUMERIC(12,2),
    close      NUMERIC(12,2),
    volume     BIGINT
);

CREATE TABLE stock_prices (
    trade_date DATE,
    ticker     VARCHAR(20),
    sector     VARCHAR(30),
    close      NUMERIC(12,2),
    volume     BIGINT,
    PRIMARY KEY (trade_date, ticker)
);

CREATE TABLE company_financials (
    fiscal_year        VARCHAR(10) PRIMARY KEY,
    revenue_cr         NUMERIC(12,1),
    cogs_cr            NUMERIC(12,1),
    gross_profit_cr    NUMERIC(12,1),
    employee_cost_cr   NUMERIC(12,1),
    marketing_cr       NUMERIC(12,1),
    other_opex_cr      NUMERIC(12,1),
    ebitda_cr          NUMERIC(12,1),
    depreciation_cr    NUMERIC(12,1),
    ebit_cr            NUMERIC(12,1),
    interest_cr        NUMERIC(12,1),
    pbt_cr             NUMERIC(12,1),
    tax_cr             NUMERIC(12,1),
    pat_cr             NUMERIC(12,1),
    stores_count       INT,
    avg_ticket_size_inr NUMERIC(10,0),
    revenue_cr_as_first_reported NUMERIC(12,1)
);

CREATE INDEX idx_txn_customer ON transactions(customer_id);
CREATE INDEX idx_txn_category ON transactions(category);
CREATE INDEX idx_stock_ticker  ON stock_prices(ticker);

-- ============================================================================
-- LOAD (psql):  \copy commands - run from the directory containing data/
-- ============================================================================
-- \copy clients            FROM 'data/client_book.csv'         CSV HEADER NULL '';
-- \copy transactions       FROM 'data/messy_transactions.csv'  CSV HEADER NULL '';
-- \copy nifty_prices       FROM 'data/nifty50_prices.csv'      CSV HEADER NULL '';
-- \copy stock_prices       FROM 'data/nse_stock_universe.csv'  CSV HEADER NULL '';
-- \copy company_financials FROM 'data/company_financials.csv'  CSV HEADER NULL '';
