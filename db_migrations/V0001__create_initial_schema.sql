CREATE TABLE IF NOT EXISTS teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rounds (
  id SERIAL PRIMARY KEY,
  round_number INTEGER NOT NULL CHECK (round_number BETWEEN 1 AND 5),
  team_id INTEGER NOT NULL REFERENCES teams(id),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  time_seconds INTEGER NOT NULL CHECK (time_seconds >= 0),
  has_blitz BOOLEAN NOT NULL DEFAULT false,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(round_number, team_id)
);

INSERT INTO teams (name) VALUES 
  ('Команда 1'),
  ('Команда 2'),
  ('Команда 3'),
  ('Команда 4')
ON CONFLICT DO NOTHING;