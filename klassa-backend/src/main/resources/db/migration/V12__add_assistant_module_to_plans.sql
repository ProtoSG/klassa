-- The assistant module's quota (aiMessagesPerMonth) was seeded via V11, but the
-- `modules` array on each plan never included 'assistant'. With the new
-- @RequiresModule("assistant") guard on AssistantController (PlanFeatureGuard),
-- every tenant was locked out — quota or no quota.
--
-- This migration adds 'assistant' to Pro and Enterprise. Starter keeps the
-- 100 msg/month quota from V11 (still useful as a teaser) but the module
-- itself remains gated — a tenant can buy messages but not the UI/tools.
-- (If we wanted Starter to also unlock the UI, we'd add it here too.)
--
-- `jsonb_set` rewrites a specific JSON path with the result of concatenating
-- the existing modules array (or `[]` when missing) with the new element.
-- The WHERE clause short-circuits re-runs so the array never grows duplicates.
UPDATE platform.plans
SET features = jsonb_set(
    features,
    '{modules}',
    COALESCE(features->'modules', '[]'::jsonb) || '["assistant"]'::jsonb
)
WHERE name IN ('Pro', 'Enterprise')
  AND NOT (COALESCE(features->'modules', '[]'::jsonb) ? 'assistant');
