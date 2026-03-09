-- Add parish column to deals table for Freguesia mapping from Maxwork import
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS parish text;