-- Create the roles table
CREATE TABLE IF NOT EXISTS app.roles (
  role_id   SMALLINT    PRIMARY KEY,
  name      TEXT        NOT NULL UNIQUE
);

-- Seed with the four core roles
INSERT INTO app.roles (role_id, name) VALUES
  (1, 'sys_admin'),
  (2, 'admin'),
  (3, 'user'),
  (4, 'viewer')
ON CONFLICT (role_id) DO NOTHING;

-- ---------------------------------------------------------------------------------------------------------------------

-- 1. Create the permissions table
CREATE TABLE IF NOT EXISTS app.permissions (
  perm_id     SMALLINT    PRIMARY KEY,
  key         TEXT        NOT NULL UNIQUE,
  description TEXT        NOT NULL
);

-- 2. Seed it with your initial permissions
INSERT INTO app.permissions (perm_id, key, description) VALUES
  ( 1,  'create_user',           'Create new users'                        ),
  ( 2,  'update_user',           'Update existing users'                   ),
  ( 3,  'delete_user',           'Delete users'                            ),
  ( 4,  'create_org',            'Create new organisations'                ),
  ( 5,  'update_org',            'Update existing organisations'           ),
  ( 6,  'delete_org',            'Delete organisations'                    ),
  ( 7,  'update_org_settings',   'Update organisation settings'            ),
  ( 8,  'view_audit_logs',       'View system audit logs'                  ),
  ( 9,  'view_asset',            'View assets'                             ),
  (10,  'create_asset',          'Create new assets'                       ),
  (11,  'update_asset',          'Update existing assets'                  ),
  (12,  'delete_asset',          'Delete assets'                           ),
  (13,  'view_device',           'View devices'                            ),
  (14,  'create_device',         'Create new devices'                      ),
  (15,  'update_device',         'Update existing devices'                 ),
  (16,  'delete_device',         'Delete devices'                          ),
  (17,  'assign_device',         'Assign devices to assets'                )
ON CONFLICT (perm_id) DO NOTHING;

-- ---------------------------------------------------------------------------------------------------------------------

-- 1. Create the role_permissions join table
CREATE TABLE IF NOT EXISTS app.role_permissions (
  role_id   SMALLINT NOT NULL,
  perm_id   SMALLINT NOT NULL,
  PRIMARY KEY (role_id, perm_id),
  FOREIGN KEY (role_id) REFERENCES app.roles(role_id) ON DELETE CASCADE,
  FOREIGN KEY (perm_id) REFERENCES app.permissions(perm_id) ON DELETE CASCADE
);

-- 2. (Optional) Seed defaults—for example:
--    sys_admin (0) gets every permission,
--    admin    (1) gets most organisation/admin perms,
--    user     (2) gets asset/device create/update/view,
--    viewer   (3) gets view-only perms.

INSERT INTO app.role_permissions (role_id, perm_id)
SELECT 1, perm_id FROM app.permissions  -- sys_admin: all perms
UNION ALL
-- admin defaults
SELECT 2, perm_id FROM app.permissions
 WHERE key IN (
   'create_user','update_user','delete_user',
   'create_org','update_org','delete_org','update_org_settings','view_audit_logs',
   'view_asset','create_asset','update_asset','delete_asset',
   'view_device','create_device','update_device','delete_device','assign_device'
 )
UNION ALL
-- user defaults
SELECT 3, perm_id FROM app.permissions
 WHERE key IN (
   'view_asset','create_asset','update_asset',
   'view_device','assign_device'
 )
UNION ALL
-- viewer defaults
SELECT 4, perm_id FROM app.permissions
 WHERE key IN (
   'view_asset','view_device'
 )
ON CONFLICT (role_id, perm_id) DO NOTHING;

CREATE OR REPLACE VIEW app.role_permissions_view AS
SELECT
    rp.role_id,
    r.name       AS role_name,
    rp.perm_id,
    p.key        AS perm_key
FROM
    app.role_permissions rp
    JOIN app.roles r        ON rp.role_id = r.role_id
    JOIN app.permissions p  ON rp.perm_id = p.perm_id;

-- ---------------------------------------------------------------------------------------------------------------------

-- 1. Create the users table
CREATE TABLE IF NOT EXISTS app.users (
    id               BIGSERIAL    PRIMARY KEY,                          -- internal PK
    uuid             UUID         NOT NULL UNIQUE DEFAULT gen_random_uuid(),
    first_name       TEXT         NOT NULL,                              -- user’s first name
    last_name        TEXT         NOT NULL,                              -- user’s last name
    email            TEXT         NOT NULL UNIQUE,
    password_hash    TEXT         NOT NULL,
    role_id          SMALLINT     NOT NULL
                       REFERENCES app.roles(role_id) ON DELETE RESTRICT,
    organisation_id  BIGINT       NOT NULL
                       REFERENCES app.organisations(id) ON DELETE RESTRICT,
    active           BOOLEAN      NOT NULL DEFAULT TRUE,
    last_login_at    TIMESTAMPTZ,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Index for fast lookups by organisation
CREATE INDEX IF NOT EXISTS idx_users_organisation_id
  ON app.users(organisation_id);

-- 3. Seed a sys_admin user (replace the hash & org ID as appropriate)
INSERT INTO app.users (
  first_name, last_name, email, password_hash, role_id, organisation_id
) VALUES (
  'System',
  'Administrator',
  'dev@user.com',
  '$2a$10$FCfWLFz9QYxNDyTAeX0Ju.O2gaYJngI8Rmryggr1rpUOPViRqVYQG',
  1,   -- sys_admin
  1    -- root organisation
)
ON CONFLICT (email) DO NOTHING;

-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app.user_organisation_access (
  user_id           BIGINT     NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  organisation_uuid UUID       NOT NULL REFERENCES app.organisations(uuid) ON DELETE CASCADE,
  is_allowed        BOOLEAN    NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, organisation_uuid)
);


CREATE OR REPLACE VIEW app.user_organisation_access_view AS
SELECT
    uoa.user_id,
    u.email              AS user_email,
    u.first_name,
    u.last_name,
    uoa.organisation_uuid,
    o.id                 AS organisation_id,
    o.name               AS organisation_name,
    uoa.is_allowed
FROM
    app.user_organisation_access uoa
    JOIN app.users u
      ON u.id = uoa.user_id
    JOIN app.organisations o
      ON o.uuid = uoa.organisation_uuid
ORDER BY
    u.email,
    o.name;


-- ---------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS app.user_asset_access (
  user_id    BIGINT     NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  asset_id   BIGINT     NOT NULL REFERENCES app.assets(id) ON DELETE CASCADE,
  is_allowed BOOLEAN    NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, asset_id)
);


CREATE OR REPLACE VIEW app.user_asset_access_view AS
SELECT
    uaa.user_id,
    u.email             AS user_email,
    u.first_name,
    u.last_name,
    uaa.asset_id,
    a.name              AS asset_name,
    uaa.is_allowed
FROM
    app.user_asset_access uaa
    JOIN app.users u
      ON u.id = uaa.user_id
    JOIN app.assets a
      ON a.id = uaa.asset_id
ORDER BY
    u.email, a.name;


-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS app.user_device_access (
  user_id    BIGINT     NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  device_id  BIGINT     NOT NULL REFERENCES app.devices(id) ON DELETE CASCADE,
  is_allowed BOOLEAN    NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, device_id)
);

CREATE OR REPLACE VIEW app.user_device_access_view AS
SELECT
    uda.user_id,
    u.email               AS user_email,
    u.first_name,
    u.last_name,
    uda.device_id,
    d.external_id         AS device_external_id,
    d.vendor,
    d.model,
    d.status,
    d.description,
    uda.is_allowed
FROM
    app.user_device_access uda
    JOIN app.users u
      ON u.id = uda.user_id
    JOIN app.devices d
      ON d.id = uda.device_id
ORDER BY
    u.email, d.external_id;

-- ---------------------------------------------------------------------
