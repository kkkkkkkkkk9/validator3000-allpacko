-- Validator 3000: Core Data Model
-- Tables: products, flows, screens, comments

-- =============================================================================
-- Table: products
-- =============================================================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  theme text NOT NULL DEFAULT 'cloud',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_products_organization ON products(organization_id);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER products_touch_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS Policies: products
CREATE POLICY products_member_select ON products FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY products_member_insert ON products FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY products_member_update ON products FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY products_member_delete ON products FOR DELETE USING (is_org_member(organization_id));

-- =============================================================================
-- Table: flows
-- =============================================================================
CREATE TABLE IF NOT EXISTS flows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (product_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_flows_product ON flows(product_id);

ALTER TABLE flows ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER flows_touch_updated_at
  BEFORE UPDATE ON flows
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS Policies: flows
CREATE POLICY flows_member_select ON flows FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY flows_member_insert ON flows FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY flows_member_update ON flows FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY flows_member_delete ON flows FOR DELETE USING (is_org_member(organization_id));

-- =============================================================================
-- Table: screens
-- =============================================================================
CREATE TABLE IF NOT EXISTS screens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id uuid NOT NULL REFERENCES flows(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  html_content text NOT NULL DEFAULT '',
  screen_type text NOT NULL DEFAULT 'standard',
  metadata jsonb DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (flow_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_screens_flow ON screens(flow_id);

ALTER TABLE screens ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER screens_touch_updated_at
  BEFORE UPDATE ON screens
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS Policies: screens
CREATE POLICY screens_member_select ON screens FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY screens_member_insert ON screens FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY screens_member_update ON screens FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY screens_member_delete ON screens FOR DELETE USING (is_org_member(organization_id));

-- =============================================================================
-- Table: comments
-- =============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  screen_id uuid NOT NULL REFERENCES screens(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_comments_screen ON comments(screen_id);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER comments_touch_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- RLS Policies: comments
CREATE POLICY comments_member_select ON comments FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY comments_member_insert ON comments FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY comments_member_update ON comments FOR UPDATE USING (is_org_member(organization_id));
CREATE POLICY comments_member_delete ON comments FOR DELETE USING (is_org_member(organization_id));

-- =============================================================================
-- Add to Realtime publication
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE flows;
ALTER PUBLICATION supabase_realtime ADD TABLE screens;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
