-- Create reminders table
create table if not exists reminders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  description text,
  due_date date not null,
  due_time time,
  person_id uuid references persons(id) on delete set null,
  completed boolean default false,
  priority text check (priority in ('low', 'medium', 'high')) default 'medium',
  category text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add indexes
create index if not exists reminders_user_id_idx on reminders(user_id);
create index if not exists reminders_person_id_idx on reminders(person_id);
create index if not exists reminders_due_date_idx on reminders(due_date);

-- Enable RLS
alter table reminders enable row level security;

-- Add RLS policies
create policy "Users can view their own reminders"
  on reminders for select
  using (auth.uid() = user_id);

create policy "Users can insert their own reminders"
  on reminders for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own reminders"
  on reminders for update
  using (auth.uid() = user_id);

create policy "Users can delete their own reminders"
  on reminders for delete
  using (auth.uid() = user_id);
