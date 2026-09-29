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
