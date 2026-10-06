\echo === users ===
SELECT id, email, deleted_at FROM "user";
\echo === provider_identity (auth) ===
SELECT pi.entity_id, pi.provider, pi.auth_identity_id, ai.app_metadata
FROM provider_identity pi
JOIN auth_identity ai ON ai.id = pi.auth_identity_id;
