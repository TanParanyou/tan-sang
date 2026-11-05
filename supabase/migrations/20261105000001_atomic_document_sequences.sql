-- ============================================================================
-- Tan-Sang - Atomic Upsert Document Sequences Migration
-- PostgreSQL Zero-Collision Concurrency Numbering
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.document_sequences (
    scope VARCHAR(64) NOT NULL DEFAULT 'GLOBAL',
    doc_type VARCHAR(32) NOT NULL,
    period VARCHAR(32) NOT NULL DEFAULT 'ALL',
    last_number BIGINT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (scope, doc_type, period)
);

CREATE INDEX IF NOT EXISTS idx_document_sequences_lookup 
    ON public.document_sequences (scope, doc_type, period);

-- ----------------------------------------------------------------------------
-- Atomic Sequence Increment Function (Zero Collision)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.next_document_sequence(
    p_scope VARCHAR(64),
    p_doc_type VARCHAR(32),
    p_period VARCHAR(32)
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_next BIGINT;
BEGIN
    INSERT INTO public.document_sequences (scope, doc_type, period, last_number, updated_at)
    VALUES (COALESCE(p_scope, 'GLOBAL'), p_doc_type, COALESCE(p_period, 'ALL'), 1, NOW())
    ON CONFLICT (scope, doc_type, period)
    DO UPDATE SET 
        last_number = public.document_sequences.last_number + 1,
        updated_at = NOW()
    RETURNING last_number INTO v_next;

    RETURN v_next;
END;
$$;
