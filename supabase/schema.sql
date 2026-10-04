-- =============================================================================
-- CPNS Lab — Supabase Schema & Row Level Security (RLS)
-- =============================================================================
-- Panduan Pemasangan:
-- 1. Buat project baru di https://supabase.com
-- 2. Buka menu "SQL Editor" di dashboard Supabase project Anda.
-- 3. Salin seluruh isi file ini, tempel ke SQL Editor, lalu jalankan (Run).
-- 4. Buka menu Project Settings -> API.
-- 5. Salin "Project URL" dan "anon public key" ke file `.env.local`:
--      NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
--      NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
-- 6. Aktifkan Auth Provider yang diinginkan di menu Authentication -> Providers
--    (mis. Google atau Email/Password). Untuk Google, pastikan redirect URL
--    di Google Cloud Console mengarah ke URL callback Supabase Anda.
-- =============================================================================

-- 1. TABEL: exam_sessions (Riwayat pengerjaan simulasi & latihan)
create table if not exists public.exam_sessions (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  mode text not null,
  total_score int not null default 0,
  max_score int not null default 0,
  finished_at timestamptz not null default now(),
  payload jsonb not null
);

-- Index untuk mempercepat query riwayat berdasarkan user dan tanggal
create index if not exists idx_exam_sessions_user_finished
  on public.exam_sessions (user_id, finished_at desc);

-- 2. TABEL: wrong_questions (Daftar & frekuensi soal yang pernah dijawab salah)
create table if not exists public.wrong_questions (
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  question_id text not null,
  count int not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- 3. TABEL: custom_questions (Bank soal tambahan/kustom milik user)
create table if not exists public.custom_questions (
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  question_id text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  primary key (user_id, question_id)
);

-- =============================================================================
-- TRIGGER: Memastikan user_id selalu terisi auth.uid() jika tidak disertakan
-- =============================================================================
create or replace function public.handle_set_user_id()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists tr_exam_sessions_user_id on public.exam_sessions;
create trigger tr_exam_sessions_user_id
  before insert on public.exam_sessions
  for each row execute function public.handle_set_user_id();

drop trigger if exists tr_wrong_questions_user_id on public.wrong_questions;
create trigger tr_wrong_questions_user_id
  before insert on public.wrong_questions
  for each row execute function public.handle_set_user_id();

drop trigger if exists tr_custom_questions_user_id on public.custom_questions;
create trigger tr_custom_questions_user_id
  before insert on public.custom_questions
  for each row execute function public.handle_set_user_id();

-- =============================================================================
-- FUNCTION RPC: upsert_wrong_question
-- Dipanggil saat jawaban salah untuk menambah akumulasi count secara atomik
-- =============================================================================
create or replace function public.upsert_wrong_question(p_question_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.wrong_questions (user_id, question_id, count, updated_at)
  values (v_uid, p_question_id, 1, now())
  on conflict (user_id, question_id)
  do update set
    count = public.wrong_questions.count + 1,
    updated_at = now();
end;
$$;

-- Beri izin eksekusi RPC untuk authenticated users
grant execute on function public.upsert_wrong_question(text) to authenticated;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Pengguna hanya dapat membaca dan memodifikasi data miliknya sendiri.
-- =============================================================================

-- Aktifkan RLS pada seluruh tabel
alter table public.exam_sessions enable row level security;
alter table public.wrong_questions enable row level security;
alter table public.custom_questions enable row level security;

-- Policies: exam_sessions
drop policy if exists "Users can view own exam sessions" on public.exam_sessions;
create policy "Users can view own exam sessions"
  on public.exam_sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own exam sessions" on public.exam_sessions;
create policy "Users can insert own exam sessions"
  on public.exam_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own exam sessions" on public.exam_sessions;
create policy "Users can delete own exam sessions"
  on public.exam_sessions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policies: wrong_questions
drop policy if exists "Users can view own wrong questions" on public.wrong_questions;
create policy "Users can view own wrong questions"
  on public.wrong_questions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own wrong questions" on public.wrong_questions;
create policy "Users can insert own wrong questions"
  on public.wrong_questions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own wrong questions" on public.wrong_questions;
create policy "Users can update own wrong questions"
  on public.wrong_questions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own wrong questions" on public.wrong_questions;
create policy "Users can delete own wrong questions"
  on public.wrong_questions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Policies: custom_questions
drop policy if exists "Users can view own custom questions" on public.custom_questions;
create policy "Users can view own custom questions"
  on public.custom_questions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own custom questions" on public.custom_questions;
create policy "Users can insert own custom questions"
  on public.custom_questions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own custom questions" on public.custom_questions;
create policy "Users can update own custom questions"
  on public.custom_questions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own custom questions" on public.custom_questions;
create policy "Users can delete own custom questions"
  on public.custom_questions for delete
  to authenticated
  using (auth.uid() = user_id);

-- Update policy exam_sessions: dibutuhkan upsert auto-sync (last-write-wins
-- per sesi id sama antar perangkat).
drop policy if exists "Users can update own exam sessions" on public.exam_sessions;
create policy "Users can update own exam sessions"
  on public.exam_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================================
-- 4. TABEL: questions (Bank soal bersama — sumber kebenaran aplikasi)
-- Diisi via seed lokal (scripts/seed-questions.mjs) memakai SERVICE_ROLE key.
-- Baca publik agar app (anon pun) bisa memuat bank; tulis TANPA policy →
-- hanya service_role yang bisa insert/update/delete.
-- =============================================================================
create table if not exists public.questions (
  id text primary key,               -- "ALF-TWK1-001"
  category text not null,            -- TWK | TIU | TKP
  sub text not null,                 -- subkategori/tema
  payload jsonb not null,            -- objek Question lengkap (text, options, answer/points, explanation, visual?)
  updated_at timestamptz not null default now()
);

create index if not exists idx_questions_category on public.questions (category, id);

alter table public.questions enable row level security;

drop policy if exists "Public read questions" on public.questions;
create policy "Public read questions"
  on public.questions for select
  to anon, authenticated
  using (true);

-- =============================================================================
-- 5. TABEL: chat_sessions (Riwayat percakapan Tutor AI, sinkron per akun)
-- Messages disimpan utuh (jsonb) — dibuat & diperbarui client (stateless,
-- store=false di sisi Google). updated_at ditetapkan client (last-write-wins).
-- =============================================================================
create table if not exists public.chat_sessions (
  id text primary key,                -- "C-<timestamp>" dari client
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  title text not null default 'Percakapan',
  context_question_id text,           -- id soal bila mulai dari "Tanya lebih lanjut"
  context_label text,                 -- label ringkas konteks, mis. "TIU — Pola Bilangan"
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_chat_sessions_user_updated
  on public.chat_sessions (user_id, updated_at desc);

drop trigger if exists tr_chat_sessions_user_id on public.chat_sessions;
create trigger tr_chat_sessions_user_id
  before insert on public.chat_sessions
  for each row execute function public.handle_set_user_id();

alter table public.chat_sessions enable row level security;

drop policy if exists "Users can view own chat sessions" on public.chat_sessions;
create policy "Users can view own chat sessions"
  on public.chat_sessions for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own chat sessions" on public.chat_sessions;
create policy "Users can insert own chat sessions"
  on public.chat_sessions for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own chat sessions" on public.chat_sessions;
create policy "Users can update own chat sessions"
  on public.chat_sessions for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own chat sessions" on public.chat_sessions;
create policy "Users can delete own chat sessions"
  on public.chat_sessions for delete
  to authenticated
  using (auth.uid() = user_id);

-- =============================================================================
-- 4. TABEL: ai_quota_usage (Perkiraan kuota request AI harian per model)
-- Reset window mengikuti tengah malam PT (zona America/Los_Angeles, DST-aware).
-- Limit harian di RPC harus sinkron dengan AI_MODEL_OPTIONS di src/lib/ai-options.ts.
-- =============================================================================
create table if not exists public.ai_quota_usage (
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  model text not null,
  window_reset_at timestamptz not null,
  count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, model, window_reset_at)
);

drop trigger if exists tr_ai_quota_usage_user_id on public.ai_quota_usage;
create trigger tr_ai_quota_usage_user_id
  before insert on public.ai_quota_usage
  for each row execute function public.handle_set_user_id();

-- FUNCTION RPC: record_ai_usage — tambah satu pemakaian secara atomik dan
-- kembalikan pemakaian window berjalan (used, limit, resetAt).
create or replace function public.record_ai_usage(p_model text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_limit int;
  v_used int;
  v_reset timestamptz;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  -- Tengah malam PT berikutnya (Postgres menangani DST via nama zona).
  v_reset := ((
    (((now() AT TIME ZONE 'America/Los_Angeles')::date + 1))::timestamp
  ) AT TIME ZONE 'America/Los_Angeles');

  insert into public.ai_quota_usage (user_id, model, window_reset_at, count, updated_at)
  values (v_uid, p_model, v_reset, 1, now())
  on conflict (user_id, model, window_reset_at)
  do update set count = public.ai_quota_usage.count + 1, updated_at = now();

  select q.count into v_used
  from public.ai_quota_usage q
  where q.user_id = v_uid and q.model = p_model and q.window_reset_at = v_reset;

  v_limit := case when p_model = 'gemini-3.5-flash-lite' then 500 else 20 end;

  return jsonb_build_object('used', v_used, 'limit', v_limit, 'resetAt', v_reset);
end;
$$;

-- FUNCTION RPC: get_all_ai_usage — baca pemakaian semua model pada window
-- berjalan tanpa menambah (dipakai dropdown pemilih model).
create or replace function public.get_all_ai_usage()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_reset timestamptz;
  v_usage jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_reset := ((
    (((now() AT TIME ZONE 'America/Los_Angeles')::date + 1))::timestamp
  ) AT TIME ZONE 'America/Los_Angeles');

  select coalesce(jsonb_object_agg(q.model, q.count), '{}'::jsonb)
  into v_usage
  from public.ai_quota_usage q
  where q.user_id = v_uid and q.window_reset_at = v_reset;

  return jsonb_build_object('resetAt', v_reset, 'usage', v_usage);
end;
$$;

grant execute on function public.record_ai_usage(text) to authenticated;
grant execute on function public.get_all_ai_usage() to authenticated;

alter table public.ai_quota_usage enable row level security;

drop policy if exists "Users can view own ai quota usage" on public.ai_quota_usage;
create policy "Users can view own ai quota usage"
  on public.ai_quota_usage for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own ai quota usage" on public.ai_quota_usage;
create policy "Users can insert own ai quota usage"
  on public.ai_quota_usage for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own ai quota usage" on public.ai_quota_usage;
create policy "Users can update own ai quota usage"
  on public.ai_quota_usage for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
