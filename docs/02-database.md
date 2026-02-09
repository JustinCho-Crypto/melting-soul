# 02. Database (Supabase)

---

## Schema Overview

```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│   souls     │────→│  listings   │     │ transactions │
│             │     │             │     │              │
│ - metadata  │     │ - sale info │     │ - tx history │
│ - lineage   │     │             │     │              │
└─────────────┘     └─────────────┘     └──────────────┘
```

---

## 1. souls Table

Stores Soul NFT metadata.

```sql
CREATE TABLE souls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id BIGINT UNIQUE NOT NULL,

    -- Public info (displayed in marketplace)
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    conversation_style VARCHAR(50),
    knowledge_domain TEXT[],

    -- Private info (buyer-only access)
    system_prompt TEXT,
    behavior_traits TEXT[],
    temperature DECIMAL(3,2) DEFAULT 0.7,

    -- Fork extension content
    additional_prompt TEXT,          -- Prompt to add on Fork
    added_traits TEXT[],             -- Traits to add on Fork
    temperature_override DECIMAL(3,2), -- null follows parent
    fork_note TEXT,                  -- Fork description

    -- Lineage
    parent_id UUID REFERENCES souls(id),
    generation INT DEFAULT 0,        -- 0 = Origin

    -- Meta
    creator_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_souls_token_id ON souls(token_id);
CREATE INDEX idx_souls_parent_id ON souls(parent_id);
CREATE INDEX idx_souls_creator ON souls(creator_address);
CREATE INDEX idx_souls_generation ON souls(generation);
```

### Field Description

| Field | Public | Description |
|-------|--------|-------------|
| name | Yes | Soul name |
| description | Yes | Short description |
| image_url | Yes | Avatar image |
| conversation_style | Yes | Chat style (sarcastic, formal, etc.) |
| knowledge_domain | Yes | Expertise domain array |
| system_prompt | No | Core system prompt |
| behavior_traits | No | Behavior trait array |
| temperature | No | LLM temperature |
| additional_prompt | No | Prompt added during Fork |
| added_traits | No | Traits added during Fork |

---

## 2. listings Table

Sale listings (on-chain event mirroring).

```sql
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id BIGINT UNIQUE NOT NULL,  -- On-chain listingId
    soul_id UUID REFERENCES souls(id),
    token_id BIGINT NOT NULL,
    seller_address VARCHAR(42) NOT NULL,
    price DECIMAL(36,18) NOT NULL,
    amount BIGINT NOT NULL,
    remaining_amount BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_soul ON listings(soul_id);
CREATE INDEX idx_listings_active ON listings(is_active);
CREATE INDEX idx_listings_seller ON listings(seller_address);
```

---

## 3. transactions Table

Transaction history.

```sql
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soul_id UUID REFERENCES souls(id),
    listing_id BIGINT,
    tx_hash VARCHAR(66) NOT NULL,
    tx_type VARCHAR(20) NOT NULL,  -- 'create', 'fork', 'list', 'buy', 'cancel'
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    price DECIMAL(36,18),
    amount BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tx_soul ON transactions(soul_id);
CREATE INDEX idx_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_tx_type ON transactions(tx_type);
```

---

## 4. Views

### soul_stats (Statistics View)

```sql
CREATE VIEW soul_stats AS
SELECT
    s.id,
    s.token_id,
    s.name,
    s.generation,
    s.creator_address,
    COUNT(DISTINCT f.id) as fork_count,
    COUNT(DISTINCT t.id) as sale_count,
    COALESCE(SUM(CASE WHEN t.tx_type = 'buy' THEN t.price END), 0) as total_volume,
    MIN(l.price) as floor_price
FROM souls s
LEFT JOIN souls f ON f.parent_id = s.id
LEFT JOIN transactions t ON t.soul_id = s.id
LEFT JOIN listings l ON l.soul_id = s.id AND l.is_active = true
GROUP BY s.id;
```

### lineage_tree (Lineage Query)

```sql
-- Get all descendants of a Soul
CREATE OR REPLACE FUNCTION get_descendants(root_id UUID)
RETURNS TABLE (
    id UUID,
    token_id BIGINT,
    name VARCHAR,
    generation INT,
    parent_id UUID
) AS $$
WITH RECURSIVE tree AS (
    SELECT id, token_id, name, generation, parent_id
    FROM souls
    WHERE id = root_id

    UNION ALL

    SELECT s.id, s.token_id, s.name, s.generation, s.parent_id
    FROM souls s
    JOIN tree t ON s.parent_id = t.id
)
SELECT * FROM tree;
$$ LANGUAGE SQL;

-- Get all ancestors of a Soul
CREATE OR REPLACE FUNCTION get_ancestors(leaf_id UUID)
RETURNS TABLE (
    id UUID,
    token_id BIGINT,
    name VARCHAR,
    generation INT,
    parent_id UUID
) AS $$
WITH RECURSIVE tree AS (
    SELECT id, token_id, name, generation, parent_id
    FROM souls
    WHERE id = leaf_id

    UNION ALL

    SELECT s.id, s.token_id, s.name, s.generation, s.parent_id
    FROM souls s
    JOIN tree t ON s.id = t.parent_id
)
SELECT * FROM tree;
$$ LANGUAGE SQL;
```

---

## 5. RLS (Row Level Security)

```sql
-- Enable RLS
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow public reads
CREATE POLICY "Public read" ON souls FOR SELECT USING (true);
CREATE POLICY "Public read" ON listings FOR SELECT USING (true);
CREATE POLICY "Public read" ON transactions FOR SELECT USING (true);

-- Allow all inserts (auth handled in frontend)
CREATE POLICY "Allow insert" ON souls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON transactions FOR INSERT WITH CHECK (true);
```

---

## 6. Sample Data (Seed Souls)

```sql
-- Insert 16 seed Souls example
INSERT INTO souls (token_id, name, description, image_url, conversation_style, knowledge_domain, system_prompt, behavior_traits, temperature, generation, creator_address)
VALUES
(1, 'Cynical Philosopher', 'A philosopher who questions and critically examines everything', '/images/philosopher.png', 'sarcastic', ARRAY['philosophy', 'logic'], 'You are a cynical philosopher who questions everything...', ARRAY['logical', 'critical', 'sarcastic'], 0.7, 0, '0xCREATOR_ADDRESS'),
(2, 'Passionate Coach', 'A passionate coach who draws out your potential', '/images/coach.png', 'enthusiastic', ARRAY['self-improvement', 'motivation'], 'You are an enthusiastic life coach...', ARRAY['passionate', 'positive', 'encouraging'], 0.8, 0, '0xCREATOR_ADDRESS'),
-- ... remaining 14
```

---

## 7. Supabase Client Setup

### Frontend (TypeScript)

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Type definitions
export interface Soul {
  id: string
  token_id: number
  name: string
  description: string
  image_url: string
  conversation_style: string
  knowledge_domain: string[]
  system_prompt?: string  // buyer only
  behavior_traits?: string[]
  temperature?: number
  additional_prompt?: string
  added_traits?: string[]
  fork_note?: string
  parent_id?: string
  generation: number
  creator_address: string
  created_at: string
}

export interface Listing {
  id: string
  listing_id: number
  soul_id: string
  token_id: number
  seller_address: string
  price: string
  amount: number
  remaining_amount: number
  is_active: boolean
}
```

### Query Examples

```typescript
// Soul list (public info only)
const { data: souls } = await supabase
  .from('souls')
  .select('id, token_id, name, description, image_url, conversation_style, knowledge_domain, generation, creator_address')
  .order('created_at', { ascending: false })

// Specific Soul + active listings
const { data: soul } = await supabase
  .from('souls')
  .select(`
    *,
    listings!inner(*)
  `)
  .eq('token_id', tokenId)
  .eq('listings.is_active', true)
  .single()

// Lineage query (descendants)
const { data: descendants } = await supabase
  .rpc('get_descendants', { root_id: soulId })

// Statistics
const { data: stats } = await supabase
  .from('soul_stats')
  .select('*')
  .order('total_volume', { ascending: false })
  .limit(20)
```
