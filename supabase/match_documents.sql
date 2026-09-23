-- Run this once in the Supabase SQL editor after creating the `documents`
-- table (see PLAN.md Phase 8). It powers lib/retriever.ts's similarity search.
create or replace function match_documents (
  query_embedding vector(384),
  match_count int default 4,
  match_threshold float default 0.2
)
returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.content,
    documents.metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where 1 - (documents.embedding <=> query_embedding) > match_threshold
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;

-- Speeds up the <=> similarity search once you have a meaningful number of rows.
create index if not exists documents_embedding_idx
  on documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);
