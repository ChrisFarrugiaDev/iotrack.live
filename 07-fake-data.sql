-- Additional fake orgs

INSERT INTO app.organisations (id, uuid, name, parent_org_id)
VALUES
  (3, '33333333-3333-3333-3333-333333333333', 'Finance Dept', 1),
  (4, '44444444-4444-4444-4444-444444444444', 'Engineering', 1),
  (5, '55555555-5555-5555-5555-555555555555', 'QA Team', 4),
  (6, '66666666-6666-6666-6666-666666666666', 'Mobile Devs', 4)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------

INSERT INTO app.user_organisation_access (user_id, organisation_uuid, is_allowed)
VALUES (1, '33333333-3333-3333-3333-333333333333', TRUE);

INSERT INTO app.user_organisation_access (user_id, organisation_uuid, is_allowed)
VALUES (1, '55555555-5555-5555-5555-555555555555', FALSE);

-- ---------------------------------------------------------------------

INSERT INTO app.users (
  first_name, last_name, email, password_hash, role_id, organisation_id
) VALUES
  ('Alice',   'Manager',      'alice@acme.com',   '$2a$10$FCfWLFz9QYxNDyTAeX0Ju.O2gaYJngI8Rmryggr1rpUOPViRqVYQG', 2, 3),
  ('Bob',     'Employee',     'bob@acme.com',     '$2a$10$FCfWLFz9QYxNDyTAeX0Ju.O2gaYJngI8Rmryggr1rpUOPViRqVYQG', 3, 4),
  ('Carol',   'Viewer',       'carol@acme.com',   '$2a$10$FCfWLFz9QYxNDyTAeX0Ju.O2gaYJngI8Rmryggr1rpUOPViRqVYQG', 4, 5),
  ('Dave',    'ReadOnly',     'dave@acme.com',    '$2a$10$FCfWLFz9QYxNDyTAeX0Ju.O2gaYJngI8Rmryggr1rpUOPViRqVYQG', 4, 6)
ON CONFLICT (email) DO NOTHING;



INSERT INTO app.devices (
    uuid, organisation_id, external_id, external_id_type, protocol, vendor, model, status
)
VALUES
  -- 5 FMC130
  (gen_random_uuid(), 2, '356000000000001', 'IMEI', 'codec8', 'Teltonika', 'FMC130', 'active'),
  (gen_random_uuid(), 3, '356000000000002', 'IMEI', 'codec8', 'Teltonika', 'FMC130', 'active'),
  (gen_random_uuid(), 4, '356000000000003', 'IMEI', 'codec8', 'Teltonika', 'FMC130', 'active'),
  (gen_random_uuid(), 5, '356000000000004', 'IMEI', 'codec8', 'Teltonika', 'FMC130', 'active'),
  (gen_random_uuid(), 6, '356000000000005', 'IMEI', 'codec8', 'Teltonika', 'FMC130', 'active'),

  -- 5 TAT250
  (gen_random_uuid(), 2, '356000000000006', 'IMEI', 'codec8', 'Teltonika', 'TAT250', 'active'),
  (gen_random_uuid(), 3, '356000000000007', 'IMEI', 'codec8', 'Teltonika', 'TAT250', 'active'),
  (gen_random_uuid(), 4, '356000000000008', 'IMEI', 'codec8', 'Teltonika', 'TAT250', 'active'),
  (gen_random_uuid(), 5, '356000000000009', 'IMEI', 'codec8', 'Teltonika', 'TAT250', 'active'),
  (gen_random_uuid(), 6, '356000000000010', 'IMEI', 'codec8', 'Teltonika', 'TAT250', 'active'),

  -- 5 TNT250
  (gen_random_uuid(), 2, '356000000000011', 'IMEI', 'codec8', 'Teltonika', 'TNT250', 'active'),
  (gen_random_uuid(), 3, '356000000000012', 'IMEI', 'codec8', 'Teltonika', 'TNT250', 'active'),
  (gen_random_uuid(), 4, '356000000000013', 'IMEI', 'codec8', 'Teltonika', 'TNT250', 'active'),
  (gen_random_uuid(), 5, '356000000000014', 'IMEI', 'codec8', 'Teltonika', 'TNT250', 'active'),
  (gen_random_uuid(), 6, '356000000000015', 'IMEI', 'codec8', 'Teltonika', 'TNT250', 'active'),

  -- 5 FTP100
  (gen_random_uuid(), 2, '356000000000016', 'IMEI', 'codec8', 'Teltonika', 'FTP100', 'active'),
  (gen_random_uuid(), 3, '356000000000017', 'IMEI', 'codec8', 'Teltonika', 'FTP100', 'active'),
  (gen_random_uuid(), 4, '356000000000018', 'IMEI', 'codec8', 'Teltonika', 'FTP100', 'active'),
  (gen_random_uuid(), 5, '356000000000019', 'IMEI', 'codec8', 'Teltonika', 'FTP100', 'active'),
  (gen_random_uuid(), 6, '356000000000020', 'IMEI', 'codec8', 'Teltonika', 'FTP100', 'active')
;


-- ---------------------------------------------------------------------

INSERT INTO app.assets (
    uuid, organisation_id, name, asset_type
) VALUES
  (gen_random_uuid(), 2, 'Fleet Car 01', 'vehicle'),
  (gen_random_uuid(), 2, 'Fleet Car 02', 'vehicle'),
  (gen_random_uuid(), 3, 'Delivery Van', 'vehicle'),
  (gen_random_uuid(), 3, 'Company Laptop', 'equipment'),
  (gen_random_uuid(), 3, 'Printer HQ', 'equipment'),
  (gen_random_uuid(), 4, 'Engineering Truck', 'vehicle'),
  (gen_random_uuid(), 4, 'Toolbox A', 'equipment'),
  (gen_random_uuid(), 4, 'Mobile Test Device', 'equipment'),
  (gen_random_uuid(), 5, 'QA Lab Device', 'equipment'),
  (gen_random_uuid(), 5, 'QA Demo Car', 'vehicle'),
  (gen_random_uuid(), 6, 'Mobile Dev Tablet', 'equipment'),
  (gen_random_uuid(), 6, 'Mobile Scooter', 'vehicle');


-- ---------------------------------------------------------------------


-- User 2 (Alice) is explicitly allowed asset 1, denied asset 2
INSERT INTO app.user_asset_access (user_id, asset_id, is_allowed)
VALUES (2, 1, TRUE);

INSERT INTO app.user_asset_access (user_id, asset_id, is_allowed)
VALUES (2, 2, FALSE);

-- User 3 (Bob) is allowed asset 4 and 7
INSERT INTO app.user_asset_access (user_id, asset_id, is_allowed)
VALUES (3, 4, TRUE),
       (3, 7, TRUE);

-- User 4 (Carol) is denied asset 10
INSERT INTO app.user_asset_access (user_id, asset_id, is_allowed)
VALUES (4, 10, FALSE);

-- ---------------------------------------------------------------------


-- User 2 (Alice) is explicitly allowed device 1, denied device 2
INSERT INTO app.user_device_access (user_id, device_id, is_allowed)
VALUES (2, 1, TRUE);

INSERT INTO app.user_device_access (user_id, device_id, is_allowed)
VALUES (2, 2, FALSE);

-- User 3 (Bob) is allowed device 4 and 7
INSERT INTO app.user_device_access (user_id, device_id, is_allowed)
VALUES (3, 4, TRUE),
       (3, 7, TRUE);

-- User 4 (Carol) is denied device 10
INSERT INTO app.user_device_access (user_id, device_id, is_allowed)
VALUES (4, 10, FALSE);

-- ---------------------------------------------------------------------