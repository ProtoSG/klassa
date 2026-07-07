INSERT INTO platform.plans (name, max_students, price_monthly, features, user_created) VALUES
    ('Starter',  100,   49.00, '{"modules": ["students", "attendance", "scores"]}',                                   'SYSTEM'),
    ('Pro',      500,  129.00, '{"modules": ["students", "attendance", "scores", "billing", "reports"]}',             'SYSTEM'),
    ('Enterprise', 99999, 299.00, '{"modules": ["students", "attendance", "scores", "billing", "reports", "api"]}',  'SYSTEM');
