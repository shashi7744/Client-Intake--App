-- Schema for the Client & Complaint Registry app, run by scripts/migrate.js
-- against your Neon (or any Postgres) database. Safe to re-run - every
-- statement is idempotent (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS members (
  email         TEXT PRIMARY KEY,
  password      TEXT NOT NULL, -- TODO: bcrypt hash before going live
  phone         TEXT,
  is_paid       BOOLEAN NOT NULL DEFAULT FALSE,
  role          TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  member_since  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS citizens (
  email       TEXT PRIMARY KEY,
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per email; a new send overwrites the previous code. Expired rows
-- are simply ignored at verify time (a periodic cleanup isn't required for
-- this app's volume, but you could add one later if the table grows large).
CREATE TABLE IF NOT EXISTS email_otps (
  email       TEXT PRIMARY KEY,
  otp         TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  gender        TEXT NOT NULL,
  dob           DATE NOT NULL,
  age           INTEGER NOT NULL,
  contact       TEXT NOT NULL,
  reference     TEXT,
  post          TEXT NOT NULL,
  address       TEXT NOT NULL,
  state         TEXT NOT NULL,
  district      TEXT NOT NULL,
  taluka        TEXT NOT NULL,
  city          TEXT NOT NULL,
  ward          TEXT NOT NULL,
  submitted_by  TEXT NOT NULL REFERENCES members(email) ON DELETE CASCADE,
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_clients_submitted_by ON clients(submitted_by);
CREATE INDEX IF NOT EXISTS idx_clients_district ON clients(district);
ALTER TABLE clients DROP COLUMN IF EXISTS aadhar_masked;

CREATE TABLE IF NOT EXISTS complaints (
  id           TEXT PRIMARY KEY,
  category     TEXT NOT NULL,
  description  TEXT NOT NULL,
  photo        TEXT, -- data URL of an optional attached photo
  state        TEXT NOT NULL,
  district     TEXT NOT NULL,
  taluka       TEXT NOT NULL,
  city         TEXT NOT NULL,
  ward         TEXT NOT NULL,
  contact      TEXT NOT NULL, -- citizen's email address
  status       TEXT NOT NULL DEFAULT 'Pending'
               CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_complaints_contact ON complaints(contact);
CREATE INDEX IF NOT EXISTS idx_complaints_district ON complaints(district);

CREATE TABLE IF NOT EXISTS access_requests (
  id               TEXT PRIMARY KEY,
  client_id        TEXT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  client_name      TEXT NOT NULL, -- denormalized for easy display in notifications
  requester_email  TEXT NOT NULL REFERENCES members(email) ON DELETE CASCADE,
  owner_email      TEXT NOT NULL REFERENCES members(email) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'denied')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at     TIMESTAMPTZ,
  UNIQUE (client_id, requester_email)
);
CREATE INDEX IF NOT EXISTS idx_access_requests_owner ON access_requests(owner_email);
CREATE INDEX IF NOT EXISTS idx_access_requests_requester ON access_requests(requester_email);
