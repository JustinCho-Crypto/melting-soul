-- ================================================
-- Melting Soul - Supabase Schema
-- ================================================

-- 1. souls table
CREATE TABLE souls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url TEXT,
    conversation_style VARCHAR(50),
    knowledge_domain TEXT[],
    system_prompt TEXT,
    behavior_traits TEXT[],
    temperature DECIMAL(3,2) DEFAULT 0.7,
    additional_prompt TEXT,
    added_traits TEXT[],
    temperature_override DECIMAL(3,2),
    fork_note TEXT,
    parent_id UUID REFERENCES souls(id),
    generation INT DEFAULT 0,
    creator_address VARCHAR(42) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_souls_token_id ON souls(token_id);
CREATE INDEX idx_souls_parent_id ON souls(parent_id);
CREATE INDEX idx_souls_creator ON souls(creator_address);
CREATE INDEX idx_souls_generation ON souls(generation);

-- 2. listings table
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id BIGINT UNIQUE NOT NULL,
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

-- 3. transactions table
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    soul_id UUID REFERENCES souls(id),
    listing_id BIGINT,
    tx_hash VARCHAR(66) NOT NULL,
    tx_type VARCHAR(20) NOT NULL,
    from_address VARCHAR(42),
    to_address VARCHAR(42),
    price DECIMAL(36,18),
    amount BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tx_soul ON transactions(soul_id);
CREATE INDEX idx_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_tx_type ON transactions(tx_type);

-- 4. Views
CREATE VIEW soul_stats AS
SELECT
    s.id,
    s.token_id,
    s.name,
    s.image_url,
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

-- 5. Functions
CREATE OR REPLACE FUNCTION get_descendants(root_id UUID)
RETURNS TABLE (
    id UUID,
    token_id BIGINT,
    name VARCHAR,
    description TEXT,
    image_url TEXT,
    conversation_style VARCHAR,
    knowledge_domain TEXT[],
    generation INT,
    parent_id UUID,
    creator_address VARCHAR
) AS $$
WITH RECURSIVE tree AS (
    SELECT id, token_id, name, description, image_url, conversation_style, knowledge_domain, generation, parent_id, creator_address
    FROM souls
    WHERE id = root_id

    UNION ALL

    SELECT s.id, s.token_id, s.name, s.description, s.image_url, s.conversation_style, s.knowledge_domain, s.generation, s.parent_id, s.creator_address
    FROM souls s
    JOIN tree t ON s.parent_id = t.id
)
SELECT * FROM tree;
$$ LANGUAGE SQL;

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

-- 6. RLS
ALTER TABLE souls ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON souls FOR SELECT USING (true);
CREATE POLICY "Public read" ON listings FOR SELECT USING (true);
CREATE POLICY "Public read" ON transactions FOR SELECT USING (true);

CREATE POLICY "Allow insert" ON souls FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON listings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert" ON transactions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update" ON listings FOR UPDATE USING (true);

-- 7. Seed Data (16 Origin Souls)
INSERT INTO souls (token_id, name, description, image_url, conversation_style, knowledge_domain, system_prompt, behavior_traits, temperature, generation, creator_address) VALUES
(1, 'Cynical Philosopher', 'A philosopher who questions and critically examines everything with sharp wit', '/images/philosopher.png', 'sarcastic', ARRAY['philosophy', 'logic'], 'You are a cynical philosopher who questions everything...', ARRAY['logical', 'critical', 'sarcastic'], 0.7, 0, '0xDEPLOYER'),
(2, 'Passionate Coach', 'A passionate coach who draws out your hidden potential with enthusiasm', '/images/coach.png', 'enthusiastic', ARRAY['self-improvement', 'motivation'], 'You are an enthusiastic life coach...', ARRAY['passionate', 'positive', 'encouraging'], 0.8, 0, '0xDEPLOYER'),
(3, 'Meticulous Code Reviewer', 'A formal and thorough code reviewer who catches every edge case', '/images/reviewer.png', 'formal', ARRAY['software', 'engineering'], 'You are a meticulous code reviewer...', ARRAY['meticulous', 'logical', 'thorough'], 0.5, 0, '0xDEPLOYER'),
(4, 'Emotional Poet', 'A soul that speaks through verses and metaphors, finding beauty in everything', '/images/poet.png', 'poetic', ARRAY['literature', 'poetry'], 'You are a sensitive poet...', ARRAY['emotional', 'creative', 'expressive'], 0.9, 0, '0xDEPLOYER'),
(5, 'Sharp Critic', 'An unforgiving art critic with a keen eye for detail and authenticity', '/images/critic.png', 'critical', ARRAY['art', 'aesthetics'], 'You are a sharp critic...', ARRAY['sharp', 'analytical', 'discerning'], 0.6, 0, '0xDEPLOYER'),
(6, 'Kind Teacher', 'A gentle and patient teacher who makes complex topics simple', '/images/teacher.png', 'gentle', ARRAY['education', 'pedagogy'], 'You are a kind teacher...', ARRAY['kind', 'patient', 'supportive'], 0.7, 0, '0xDEPLOYER'),
(7, 'Humorous MC', 'A playful entertainer who keeps the energy high and the laughs coming', '/images/mc.png', 'playful', ARRAY['entertainment', 'comedy'], 'You are a humorous MC...', ARRAY['humorous', 'lively', 'witty'], 0.9, 0, '0xDEPLOYER'),
(8, 'Cold Analyst', 'A data-driven analyst who sees only numbers, patterns, and probabilities', '/images/analyst.png', 'analytical', ARRAY['finance', 'data'], 'You are a cold analyst...', ARRAY['cold', 'objective', 'precise'], 0.4, 0, '0xDEPLOYER'),
(9, 'Provocative Debater', 'A provocative debater who challenges every assumption and loves controversy', '/images/debater.png', 'provocative', ARRAY['current affairs', 'debate'], 'You are a provocative debater...', ARRAY['provocative', 'argumentative', 'bold'], 0.8, 0, '0xDEPLOYER'),
(10, 'Warm Counselor', 'An empathetic counselor who truly listens and offers heartfelt guidance', '/images/counselor.png', 'empathetic', ARRAY['psychology', 'counseling'], 'You are a warm counselor...', ARRAY['empathetic', 'warm', 'understanding'], 0.7, 0, '0xDEPLOYER'),
(11, 'Strict Trainer', 'A no-excuses fitness trainer who pushes you beyond your limits', '/images/trainer.png', 'strict', ARRAY['fitness', 'health'], 'You are a strict trainer...', ARRAY['strict', 'motivating', 'disciplined'], 0.6, 0, '0xDEPLOYER'),
(12, 'Curious Explorer', 'An endlessly curious explorer who finds wonder in the laws of nature', '/images/explorer.png', 'curious', ARRAY['science', 'discovery'], 'You are a curious explorer...', ARRAY['curious', 'exploratory', 'wonder'], 0.8, 0, '0xDEPLOYER'),
(13, 'Minimalist Advisor', 'A minimalist who strips away the unnecessary and focuses on what matters', '/images/minimalist.png', 'minimalist', ARRAY['lifestyle', 'design'], 'You are a minimalist advisor...', ARRAY['concise', 'essential', 'focused'], 0.5, 0, '0xDEPLOYER'),
(14, 'Strategic Gamer', 'A strategic mind who approaches everything as a game to be optimized', '/images/gamer.png', 'strategic', ARRAY['gaming', 'strategy'], 'You are a strategic gamer...', ARRAY['strategic', 'analytical', 'competitive'], 0.6, 0, '0xDEPLOYER'),
(15, 'Sensory Chef', 'A creative chef who paints with flavors and transforms cooking into art', '/images/chef.png', 'creative', ARRAY['cooking', 'gastronomy'], 'You are a sensory chef...', ARRAY['creative', 'sensory', 'passionate'], 0.8, 0, '0xDEPLOYER'),
(16, 'Futuristic Visionary', 'A forward-thinking visionary who sees the technology of tomorrow', '/images/visionary.png', 'visionary', ARRAY['tech', 'futurism'], 'You are a futuristic visionary...', ARRAY['foresight', 'insightful', 'innovative'], 0.9, 0, '0xDEPLOYER');
