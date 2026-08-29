-- The assistant module (AssistantService.resolveMonthlyQuota) reads
-- features->>'aiMessagesPerMonth' and treats a missing key as quota 0,
-- which locked every existing tenant out of the AI assistant on first use.
UPDATE platform.plans SET features = features || '{"aiMessagesPerMonth": 100}'::jsonb WHERE name = 'Starter';
UPDATE platform.plans SET features = features || '{"aiMessagesPerMonth": 400}'::jsonb WHERE name = 'Pro';
UPDATE platform.plans SET features = features || '{"aiMessagesPerMonth": 2000}'::jsonb WHERE name = 'Enterprise';
