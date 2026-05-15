-- Populate user_stats for all existing users who don't have stats yet
INSERT INTO public.user_stats (id, user_id, total_points, level, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  u.id,
  0,
  1,
  now(),
  now()
FROM public.users u
WHERE u.deleted_at IS NULL
AND NOT EXISTS (SELECT 1 FROM public.user_stats us WHERE us.user_id = u.id)
ON CONFLICT (user_id) DO NOTHING;
