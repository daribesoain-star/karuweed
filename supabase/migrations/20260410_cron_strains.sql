SELECT cron.schedule(
  'update-strains-daily',
  '0 6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://ymvnflwcxwgsyhramhex.supabase.co/functions/v1/update-strains',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltdm5mbHdjeHdnc3locmFtaGV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUyMTgwMDcsImV4cCI6MjA5MDc5NDAwN30.o-4U-sTTDXxKHtU23RkgWX6ctizVRAo1GGX6RDzxKCM'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
