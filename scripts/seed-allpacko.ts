/**
 * Seed script: Import Allpacko prototype screens into Validator 3000
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... V3K_ORG_ID=... npx tsx scripts/seed-allpacko.ts
 *
 * This reads the per-screen HTML files from scripts/allpacko-screens/ and
 * inserts them into the products / flows / screens tables.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ---------------------------------------------------------------------------
// Supabase client (service-role, bypasses RLS)
// ---------------------------------------------------------------------------
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const orgId = process.env.V3K_ORG_ID;

if (!supabaseUrl || !supabaseKey || !orgId) {
  console.error(
    "Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, V3K_ORG_ID"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---------------------------------------------------------------------------
// Flow definitions — each flow lists its screens in order
// ---------------------------------------------------------------------------
interface FlowDef {
  name: string;
  slug: string;
  screens: string[];
}

const flows: FlowDef[] = [
  {
    name: "New User Signup",
    slug: "new-user-signup",
    screens: [
      "screen-auth",
      "screen-otp",
      "screen-otp-wrong",
      "screen-otp-resend",
      "screen-name",
      "screen-walkthrough-intro",
      "screen-walkthrough-1",
      "screen-walkthrough-2",
      "screen-walkthrough-3",
      "screen-walkthrough-4",
      "screen-walkthrough-5",
      "screen-walkthrough-6",
      "screen-family",
      "screen-members",
      "screen-contacts-permission",
      "screen-contacts-access-level",
      "screen-contacts-denied",
      "screen-contacts-picker",
      "screen-add-dependent",
      "screen-home",
    ],
  },
  {
    name: "Invited User",
    slug: "invited-user",
    screens: [
      "screen-inv-lockscreen",
      "screen-inv-imessage",
      "screen-inv-appstore",
      "screen-inv-auth",
      "screen-inv-otp",
      "screen-inv-invite",
      "screen-inv-name",
      "screen-inv-home",
    ],
  },
  {
    name: "Bundle Management",
    slug: "bundle-management",
    screens: [
      "screen-bundle-home",
      "screen-bundle-create",
      "screen-bundle-saved",
      "screen-bundle-create-2",
      "screen-bundle-list",
    ],
  },
  {
    name: "Trip Management",
    slug: "trip-management",
    screens: [
      "screen-trip-home",
      "screen-trip-wizard",
      "screen-trip-bundles",
      "screen-trip-confirm",
      "screen-trip-review",
      "screen-trip-list",
    ],
  },
  {
    name: "Packing Progress",
    slug: "packing-progress",
    screens: [
      "screen-pack-detail",
      "screen-pack-progress",
      "screen-pack-family",
      "screen-pack-done",
      "screen-pack-trips",
    ],
  },
];

// ---------------------------------------------------------------------------
// Human-readable screen names (from FLOW_NAMES in the prototype)
// ---------------------------------------------------------------------------
const screenNames: Record<string, string> = {
  // New User Signup
  "screen-auth": "Continue with phone",
  "screen-otp": "OTP verification",
  "screen-otp-wrong": "Wrong code",
  "screen-otp-resend": "Resend code",
  "screen-name": "What's your name?",
  "screen-walkthrough-intro": "Nice to meet you",
  "screen-walkthrough-1": "Walkthrough: Bundles",
  "screen-walkthrough-2": "Walkthrough: Essentials",
  "screen-walkthrough-3": "Walkthrough: Family",
  "screen-walkthrough-4": "Walkthrough: Progress",
  "screen-walkthrough-5": "Walkthrough: Assign",
  "screen-walkthrough-6": "Walkthrough: All packed",
  "screen-family": "Create your family",
  "screen-members": "Add your family",
  "screen-contacts-permission": "Contacts: initial prompt",
  "screen-contacts-access-level": "Contacts: access level",
  "screen-contacts-denied": "Contacts: denied",
  "screen-contacts-picker": "Contact picker (full access)",
  "screen-add-dependent": "Add dependent",
  "screen-home": "Home screen",

  // Invited User
  "screen-inv-lockscreen": "Lock screen",
  "screen-inv-imessage": "iMessage",
  "screen-inv-appstore": "App Store",
  "screen-inv-auth": "Continue with phone",
  "screen-inv-otp": "OTP",
  "screen-inv-invite": "Invitation",
  "screen-inv-name": "Your name",
  "screen-inv-home": "Home",

  // Bundle Management
  "screen-bundle-home": "Bundles (empty)",
  "screen-bundle-create": "Create bundle",
  "screen-bundle-saved": "Bundle saved",
  "screen-bundle-create-2": "Create another",
  "screen-bundle-list": "Bundles list",

  // Trip Management
  "screen-trip-home": "Trips (empty)",
  "screen-trip-wizard": "Trip details",
  "screen-trip-bundles": "Assign bundles",
  "screen-trip-confirm": "Trip created",
  "screen-trip-review": "Review items",
  "screen-trip-list": "Trips list",

  // Packing Progress
  "screen-pack-detail": "Trip detail",
  "screen-pack-progress": "Mid-packing",
  "screen-pack-family": "Family progress",
  "screen-pack-done": "All packed!",
  "screen-pack-trips": "Trips (packed)",
};

// ---------------------------------------------------------------------------
// Helper: read a screen's HTML from disk
// ---------------------------------------------------------------------------
function readScreenHtml(screenId: string): string {
  const filePath = join(__dirname, "allpacko-screens", `${screenId}.html`);
  return readFileSync(filePath, "utf-8");
}

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------
async function seed() {
  console.log("Seeding Allpacko into org", orgId, "...\n");

  // 1. Create product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      organization_id: orgId,
      name: "Allpacko",
      slug: "allpacko",
      description:
        "The family packing app. Build lists together, never forget a thing.",
      theme: "cloud",
      sort_order: 0,
    })
    .select()
    .single();

  if (productError) {
    console.error("Failed to create product:", productError.message);
    process.exit(1);
  }
  console.log(`Created product: ${product.name} (${product.id})`);

  // 2. Create flows and screens
  let totalScreens = 0;

  for (let fi = 0; fi < flows.length; fi++) {
    const flowDef = flows[fi];

    const { data: flowRow, error: flowError } = await supabase
      .from("flows")
      .insert({
        organization_id: orgId,
        product_id: product.id,
        name: flowDef.name,
        slug: flowDef.slug,
        sort_order: fi,
      })
      .select()
      .single();

    if (flowError) {
      console.error(`Failed to create flow "${flowDef.name}":`, flowError.message);
      process.exit(1);
    }
    console.log(`  Flow ${fi}: ${flowDef.name} (${flowRow.id})`);

    // Batch-insert all screens for this flow
    const screenRows = flowDef.screens.map((screenId, si) => ({
      organization_id: orgId,
      flow_id: flowRow.id,
      name: screenNames[screenId] || screenId,
      slug: screenId.replace("screen-", ""),
      html_content: readScreenHtml(screenId),
      sort_order: si,
    }));

    const { error: screenError } = await supabase
      .from("screens")
      .insert(screenRows);

    if (screenError) {
      console.error(`Failed to insert screens for "${flowDef.name}":`, screenError.message);
      process.exit(1);
    }

    totalScreens += screenRows.length;
    console.log(`    -> ${screenRows.length} screens inserted`);
  }

  console.log(`\nDone! Created 1 product, ${flows.length} flows, ${totalScreens} screens.`);
}

seed();
