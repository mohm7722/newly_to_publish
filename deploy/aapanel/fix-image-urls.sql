-- ============================================================================
-- Rewrite imported image URLs from the old localhost origin to the live domain.
-- ----------------------------------------------------------------------------
-- The existing data stores uploaded product images as absolute URLs like
--   http://localhost:9000/static/<file>
-- After import they must point at the public origin so browsers can load them:
--   https://www.newlyye.com/static/<file>
--
-- Run AFTER importing medusa-store-export.sql and BEFORE (or after) first start:
--   psql -h 127.0.0.1 -U <db_user> -d <db_name> -f fix-image-urls.sql
--
-- Safe to run more than once (idempotent: only rows still on localhost match).
-- Demo products that use medusa-public-images.s3.* are left untouched.
-- ============================================================================
\set old 'http://localhost:9000/static/'
\set new 'https://www.newlyye.com/static/'

BEGIN;

UPDATE public.image
   SET url = replace(url, :'old', :'new')
 WHERE url LIKE :'old' || '%';

UPDATE public.product
   SET thumbnail = replace(thumbnail, :'old', :'new')
 WHERE thumbnail LIKE :'old' || '%';

UPDATE public.product_variant
   SET thumbnail = replace(thumbnail, :'old', :'new')
 WHERE thumbnail LIKE :'old' || '%';

UPDATE public.inventory_item
   SET thumbnail = replace(thumbnail, :'old', :'new')
 WHERE thumbnail LIKE :'old' || '%';

UPDATE public.order_line_item
   SET thumbnail = replace(thumbnail, :'old', :'new')
 WHERE thumbnail LIKE :'old' || '%';

UPDATE public.cart_line_item
   SET thumbnail = replace(thumbnail, :'old', :'new')
 WHERE thumbnail LIKE :'old' || '%';

UPDATE public.order_claim_item_image
   SET url = replace(url, :'old', :'new')
 WHERE url LIKE :'old' || '%';

COMMIT;

-- Report anything still pointing at localhost (should be 0 rows).
SELECT 'image' AS tbl, count(*) AS remaining FROM public.image WHERE url LIKE :'old' || '%'
UNION ALL SELECT 'product', count(*) FROM public.product WHERE thumbnail LIKE :'old' || '%'
UNION ALL SELECT 'product_variant', count(*) FROM public.product_variant WHERE thumbnail LIKE :'old' || '%';
