-- Run once against the dedicated "aquamazone" database.
-- Reviews are pending by default; only approved reviews appear publicly.
CREATE TABLE IF NOT EXISTS visitor_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 display_name varchar(60) NOT NULL CHECK(char_length(display_name) BETWEEN 2 AND 60),
 comment varchar(1000) NOT NULL CHECK(char_length(comment) BETWEEN 20 AND 1000),
 discovery_source text NOT NULL CHECK(discovery_source IN ('social','friends','search','nearby','other')),
 rating smallint CHECK(rating BETWEEN 1 AND 5),
 ip_fingerprint char(64) NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
 created_at timestamptz NOT NULL DEFAULT now(),
 approved_at timestamptz
);
CREATE INDEX IF NOT EXISTS visitor_reviews_public_order
 ON visitor_reviews(approved_at DESC,id DESC) WHERE status='approved';
CREATE INDEX IF NOT EXISTS visitor_reviews_rate_limit
 ON visitor_reviews(ip_fingerprint,created_at DESC);
-- For production, use a dedicated least-privilege database role, not the owner.
-- The runtime role needs SELECT/INSERT and UPDATE(status,approved_at) on visitor_reviews.
