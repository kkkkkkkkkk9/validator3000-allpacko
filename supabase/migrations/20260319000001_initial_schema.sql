-- Validator 3000: Initial Schema
-- Foundational tables: profiles, organizations, organization_members

-- =============================================================================
-- Helper: touch_updated_at trigger function
-- =============================================================================
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Enum: organization roles
-- =============================================================================
DO $$ BEGIN
  CREATE TYPE org_role AS ENUM ('owner', 'admin', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- Table: profiles (synced from auth.users via OAuth callback)
-- =============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER profiles_touch_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- Profiles: users can read profiles of anyone in their org, and update their own
CREATE POLICY profiles_select_self_or_org ON profiles FOR SELECT USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1 FROM organization_members self_om
    JOIN organization_members other_om ON other_om.organization_id = self_om.organization_id
    WHERE self_om.user_id = auth.uid() AND other_om.user_id = profiles.id
  )
);

CREATE POLICY profiles_insert_self ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_self ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =============================================================================
-- Table: organizations
-- =============================================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER organizations_touch_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =============================================================================
-- Table: organization_members
-- =============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role org_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS helper: is_org_member
-- =============================================================================
CREATE OR REPLACE FUNCTION is_org_member(org_id uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = org_id AND user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- =============================================================================
-- RLS Policies: organizations
-- =============================================================================
CREATE POLICY organizations_member_select ON organizations FOR SELECT USING (is_org_member(id));
CREATE POLICY organizations_member_update ON organizations FOR UPDATE USING (is_org_member(id));
-- Insert: anyone authenticated can create an org (they'll add themselves as owner)
CREATE POLICY organizations_authenticated_insert ON organizations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =============================================================================
-- RLS Policies: organization_members
-- =============================================================================
CREATE POLICY org_members_member_select ON organization_members FOR SELECT USING (is_org_member(organization_id));
-- Insert: org members can add new members, or user can add themselves (for org creation)
CREATE POLICY org_members_insert ON organization_members FOR INSERT WITH CHECK (
  is_org_member(organization_id) OR user_id = auth.uid()
);
CREATE POLICY org_members_member_delete ON organization_members FOR DELETE USING (is_org_member(organization_id));

-- =============================================================================
-- Add to Realtime publication
-- =============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE organization_members;
