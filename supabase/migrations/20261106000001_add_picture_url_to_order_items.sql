-- Migration: Add picture_url column to order_items for LINE avatar display
ALTER TABLE public.order_items 
ADD COLUMN IF NOT EXISTS picture_url TEXT;
