-- Rename assets id 10–209 with random HDI-485 style plates.
-- Run in psql or any Postgres client. Safe to re-run (new plates each time).

UPDATE app.assets
SET name = (
    chr(floor(random() * 26 + 65)::int) ||
    chr(floor(random() * 26 + 65)::int) ||
    chr(floor(random() * 26 + 65)::int) ||
    '-' ||
    floor(random() * 9 + 1)::int::text ||
    floor(random() * 10)::int::text ||
    floor(random() * 10)::int::text
)
WHERE id BETWEEN 10 AND 209;
