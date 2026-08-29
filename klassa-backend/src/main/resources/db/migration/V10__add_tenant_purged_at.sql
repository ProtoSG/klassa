-- Tracks when a CANCELLED tenant's schema was manually purged by a platform admin.
-- NULL means the tenant's data (if any) is still intact.
ALTER TABLE platform.tenants ADD COLUMN purged_at TIMESTAMPTZ;
