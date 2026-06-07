CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.chatbot_knowledge
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'umum',
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS chatbot_knowledge_embedding_idx
  ON public.chatbot_knowledge USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS chatbot_knowledge_category_idx
  ON public.chatbot_knowledge (category);

CREATE OR REPLACE FUNCTION public.match_chatbot_knowledge(
  query_embedding vector(1536),
  match_count int DEFAULT 6,
  min_similarity float DEFAULT 0.25
)
RETURNS TABLE (id uuid, title text, content text, category text, similarity float)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT id, title, content, category, 1 - (embedding <=> query_embedding) AS similarity
  FROM public.chatbot_knowledge
  WHERE is_active = true
    AND embedding IS NOT NULL
    AND 1 - (embedding <=> query_embedding) >= min_similarity
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

REVOKE ALL ON FUNCTION public.match_chatbot_knowledge(vector, int, float) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_chatbot_knowledge(vector, int, float) TO service_role;