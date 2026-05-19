CREATE TABLE contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  contact    text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous visitors) can submit a message.
-- Only service-role (admin dashboard / SQL) can read them.
CREATE POLICY "Anyone can insert a contact message"
  ON contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
