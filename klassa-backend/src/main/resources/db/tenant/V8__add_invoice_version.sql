-- Optimistic locking for invoices: prevents concurrent payments from over-paying
-- (two cashiers paying the same invoice at once). Hibernate checks version in the
-- UPDATE WHERE clause; the losing write gets OptimisticLockException.
ALTER TABLE invoices ADD COLUMN version BIGINT NOT NULL DEFAULT 0;
