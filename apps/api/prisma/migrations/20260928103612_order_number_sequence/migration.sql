-- Atomic, race-free order number generation: OrdersService.placeOrder()
-- reads this via `SELECT nextval('order_number_seq')` inside its checkout
-- transaction and formats it as "BK-<n>". A DB sequence avoids the race a
-- read-then-increment counter row would have under concurrent checkouts.
CREATE SEQUENCE IF NOT EXISTS "order_number_seq" START WITH 1000;
