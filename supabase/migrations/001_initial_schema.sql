-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Campaigns
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  join_code text unique not null default substring(md5(random()::text), 1, 6),
  created_at timestamptz default now()
);

-- Campaign membership (many users to many campaigns)
create table campaign_members (
  user_id uuid references auth.users on delete cascade,
  campaign_id uuid references campaigns on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (user_id, campaign_id)
);

-- Polls
create table polls (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns on delete cascade,
  title text not null,
  description text,
  questions jsonb not null,
  sent_count integer default 0,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- Contacts (respondents)
create table contacts (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references campaigns on delete cascade,
  phone text not null,
  name text,
  zip text,
  district text,
  city text,
  tags text[],
  created_at timestamptz default now(),
  unique(campaign_id, phone)
);

-- Individual question responses
create table responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls on delete cascade,
  contact_id uuid references contacts,
  question_id text not null,
  answer text not null,
  raw_body text,
  received_at timestamptz default now()
);

-- Cached AI analysis results
create table ai_analysis (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid references polls on delete cascade unique,
  correlations jsonb,
  insights jsonb,
  generated_at timestamptz default now()
);

-- Enable RLS on all tables
alter table campaigns enable row level security;
alter table campaign_members enable row level security;
alter table polls enable row level security;
alter table contacts enable row level security;
alter table responses enable row level security;
alter table ai_analysis enable row level security;

-- RLS: campaign_members
create policy "Users can view their own memberships"
  on campaign_members for select
  using (auth.uid() = user_id);

create policy "Users can insert their own memberships"
  on campaign_members for insert
  with check (auth.uid() = user_id);

create policy "Owners can delete members"
  on campaign_members for delete
  using (
    auth.uid() = user_id
    or exists (
      select 1 from campaign_members cm
      where cm.campaign_id = campaign_members.campaign_id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );

-- RLS: campaigns
create policy "Members can view their campaigns"
  on campaigns for select
  using (
    exists (
      select 1 from campaign_members
      where campaign_id = campaigns.id and user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert campaigns"
  on campaigns for insert
  with check (auth.role() = 'authenticated');

create policy "Owners can update campaigns"
  on campaigns for update
  using (
    exists (
      select 1 from campaign_members
      where campaign_id = campaigns.id and user_id = auth.uid() and role = 'owner'
    )
  );

-- RLS: polls
create policy "Campaign members can view polls"
  on polls for select
  using (
    exists (
      select 1 from campaign_members
      where campaign_id = polls.campaign_id and user_id = auth.uid()
    )
  );

create policy "Campaign members can insert polls"
  on polls for insert
  with check (
    exists (
      select 1 from campaign_members
      where campaign_id = polls.campaign_id and user_id = auth.uid()
    )
  );

create policy "Campaign members can update polls"
  on polls for update
  using (
    exists (
      select 1 from campaign_members
      where campaign_id = polls.campaign_id and user_id = auth.uid()
    )
  );

-- RLS: contacts
create policy "Campaign members can view contacts"
  on contacts for select
  using (
    exists (
      select 1 from campaign_members
      where campaign_id = contacts.campaign_id and user_id = auth.uid()
    )
  );

create policy "Campaign members can insert contacts"
  on contacts for insert
  with check (
    exists (
      select 1 from campaign_members
      where campaign_id = contacts.campaign_id and user_id = auth.uid()
    )
  );

-- RLS: responses
create policy "Campaign members can view responses"
  on responses for select
  using (
    exists (
      select 1 from polls p
      join campaign_members cm on cm.campaign_id = p.campaign_id
      where p.id = responses.poll_id and cm.user_id = auth.uid()
    )
  );

create policy "Campaign members can insert responses"
  on responses for insert
  with check (
    exists (
      select 1 from polls p
      join campaign_members cm on cm.campaign_id = p.campaign_id
      where p.id = responses.poll_id and cm.user_id = auth.uid()
    )
  );

-- RLS: ai_analysis
create policy "Campaign members can view ai_analysis"
  on ai_analysis for select
  using (
    exists (
      select 1 from polls p
      join campaign_members cm on cm.campaign_id = p.campaign_id
      where p.id = ai_analysis.poll_id and cm.user_id = auth.uid()
    )
  );

create policy "Campaign members can upsert ai_analysis"
  on ai_analysis for all
  using (
    exists (
      select 1 from polls p
      join campaign_members cm on cm.campaign_id = p.campaign_id
      where p.id = ai_analysis.poll_id and cm.user_id = auth.uid()
    )
  );
