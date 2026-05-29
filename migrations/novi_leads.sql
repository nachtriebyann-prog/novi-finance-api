-- novi_leads — un enregistrement par lead entrant dans le funnel Novi.
-- Le lead_id (uuid généré côté navigateur dès la landing) suit le prospect
-- et permet de relier : clic pub (UTM/fbclid) → lead → (plus tard) cash Stripe.
--
-- À appliquer dans le projet Supabase de NOVI (celui qui contient otp_codes),
-- PAS celui de la Citadel.
create table if not exists novi_leads (
  id               uuid primary key default gen_random_uuid(),
  lead_id          text unique,
  full_name        text,
  email            text,
  phone            text,
  -- Origine pub
  utm_source       text,
  utm_medium       text,
  utm_campaign     text,
  utm_content      text,
  utm_term         text,
  fbclid           text,
  gclid            text,
  referrer         text,
  -- Réponses du bilan
  age_range        text,
  family_status    text,
  taxrange         text,
  patrimoine_range text,
  objective_target text,
  -- Liens + statut
  ghl_contact_id   text,
  eligible         boolean,
  landing_at       timestamptz,
  created_at       timestamptz not null default now()
);

create index if not exists idx_novi_leads_email     on novi_leads(email);
create index if not exists idx_novi_leads_campaign  on novi_leads(utm_campaign, created_at desc);
create index if not exists idx_novi_leads_source    on novi_leads(utm_source, created_at desc);
create index if not exists idx_novi_leads_created   on novi_leads(created_at desc);
