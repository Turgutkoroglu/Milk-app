-- Migration 003: Web Push (PWA) destegi
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS web_push_subscription JSONB;
