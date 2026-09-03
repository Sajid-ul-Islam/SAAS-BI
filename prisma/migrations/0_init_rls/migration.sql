-- ==============================================================================
-- Supabase Multi-Tenant Row Level Security (RLS) Migration
-- Enforces tenant isolation at the PostgreSQL database engine level.
-- ==============================================================================

-- 1. Helper function to extract current authenticated tenantId from Supabase Auth JWT claims
CREATE OR REPLACE FUNCTION current_tenant_id() 
RETURNS UUID AS $$
BEGIN
  RETURN NULLIF(
    COALESCE(
      current_setting('request.jwt.claims', true)::jsonb -> 'app_metadata' ->> 'tenant_id',
      current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'tenant_id'
    ),
    ''
  )::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Helper function to check if current user is a Supabase service role
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'service_role',
    false
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ==============================================================================
-- Enable Row Level Security on ALL tenant-scoped tables
-- ==============================================================================

ALTER TABLE IF EXISTS tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courier_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS ai_token_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS webhook_events ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- Policies for `tenants` table
-- A tenant can only view and update their own tenant record.
-- Service role has unrestricted access for system management.
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_tenants ON tenants;
CREATE POLICY tenant_isolation_tenants ON tenants
  FOR ALL
  USING (
    is_service_role() OR id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `users` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_users ON users;
CREATE POLICY tenant_isolation_users ON users
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `stores` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_stores ON stores;
CREATE POLICY tenant_isolation_stores ON stores
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `courier_credentials` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_courier_credentials ON courier_credentials;
CREATE POLICY tenant_isolation_courier_credentials ON courier_credentials
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `orders` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_orders ON orders;
CREATE POLICY tenant_isolation_orders ON orders
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `order_status_history` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_order_status_history ON order_status_history;
CREATE POLICY tenant_isolation_order_status_history ON order_status_history
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `ai_cache` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_ai_cache ON ai_cache;
CREATE POLICY tenant_isolation_ai_cache ON ai_cache
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `ai_token_usage` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_ai_token_usage ON ai_token_usage;
CREATE POLICY tenant_isolation_ai_token_usage ON ai_token_usage
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `subscriptions` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_subscriptions ON subscriptions;
CREATE POLICY tenant_isolation_subscriptions ON subscriptions
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );

-- ==============================================================================
-- Policies for `webhook_events` table
-- ==============================================================================
DROP POLICY IF EXISTS tenant_isolation_webhook_events ON webhook_events;
CREATE POLICY tenant_isolation_webhook_events ON webhook_events
  FOR ALL
  USING (
    is_service_role() OR tenant_id = current_tenant_id()
  )
  WITH CHECK (
    is_service_role() OR tenant_id = current_tenant_id()
  );
