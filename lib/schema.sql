-- Schema for the Client & Complaint Registry app, run by scripts/migrate.js
-- against your Neon (or any Postgres) database. Safe to re-run - every
-- statement is idempotent (IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS members (
  email         TEXT PRIMARY KEY,
  password      TEXT NOT NULL, -- TODO: bcrypt hash before going live
  phone         TEXT,
  is_paid       BOOLEAN NOT NULL DEFAULT TRUE,
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
-- Wrong guesses so far; the code is discarded after too many.
ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;

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
  category     TEXT DEFAULT 'General',
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

-- District / taluka heads (sub-admins). A member can head one area; the badge
-- and "shown first" ordering in All Clients are driven by these columns.
ALTER TABLE members ADD COLUMN IF NOT EXISTS head_level TEXT CHECK (head_level IN ('district', 'taluka'));
ALTER TABLE members ADD COLUMN IF NOT EXISTS head_district TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS head_taluka TEXT;

-- Marks the client row that is the member's own profile (vs clients they
-- registered for others). Backfilled once: a member's earliest row.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_profile BOOLEAN NOT NULL DEFAULT FALSE;
UPDATE clients SET is_profile = TRUE
WHERE id IN (SELECT DISTINCT ON (submitted_by) id FROM clients ORDER BY submitted_by, submitted_at ASC)
  AND NOT EXISTS (SELECT 1 FROM clients c2 WHERE c2.submitted_by = clients.submitted_by AND c2.is_profile);

-- Mobile number so admins can reach a complainant on WhatsApp / call.
ALTER TABLE citizens ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS phone TEXT;

CREATE TABLE IF NOT EXISTS citizen_devices (
  token_hash     TEXT PRIMARY KEY,
  citizen_email  TEXT NOT NULL REFERENCES citizens(email) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Devices a member has logged in on with their password, for one-tap
-- "continue as ..." login. Only a hash of the cookie token is stored.
CREATE TABLE IF NOT EXISTS member_devices (
  token_hash    TEXT PRIMARY KEY,
  member_email  TEXT NOT NULL REFERENCES members(email) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_citizen_devices_email ON citizen_devices(citizen_email);

CREATE TABLE IF NOT EXISTS announcements (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL,
  link         TEXT,
  photo        TEXT,
  created_by   TEXT NOT NULL REFERENCES members(email) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE announcements ADD COLUMN IF NOT EXISTS photo TEXT;
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
  id              TEXT PRIMARY KEY,
  recipient_type  TEXT NOT NULL CHECK (recipient_type IN ('member', 'citizen')),
  recipient_email TEXT NOT NULL,
  kind            TEXT NOT NULL,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL DEFAULT '',
  section         TEXT, -- which dashboard screen to open when clicked
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications(recipient_type, recipient_email, created_at DESC);

-- One row per browser/phone that allowed push notifications.
CREATE TABLE IF NOT EXISTS push_subscriptions (
  endpoint        TEXT PRIMARY KEY,
  recipient_type  TEXT NOT NULL CHECK (recipient_type IN ('member', 'citizen')),
  recipient_email TEXT NOT NULL,
  p256dh          TEXT NOT NULL,
  auth            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_recipient
  ON push_subscriptions(recipient_type, recipient_email);

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
