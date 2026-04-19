-- Daily strain-update cron job.
--
-- The Bearer token is read from Supabase Vault at runtime — NEVER hardcoded.
-- Before applying this migration, load the anon key into the vault once:
--
--   SELECT vault.create_secret(
--     'eyJhbGciOi...your-anon-key...',
--     'karuweed_anon_key',
--     'Anon key used by the update-strains cron job'
--   );
--
-- (Or rotate it with: UPDATE vault.secrets SET secret = '...' WHERE name = 'karuweed_anon_key';)

SELECT cron.schedule(
  'update-strains-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ymvnflwcxwgsyhramhex.supabase.co/functions/v1/update-strains',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'karuweed_anon_key'
      )
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
