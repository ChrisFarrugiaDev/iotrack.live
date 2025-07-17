-- Create the roles table
CREATE TABLE IF NOT EXISTS app.roles (
  role_id   SMALLINT    PRIMARY KEY,
  name      TEXT        NOT NULL UNIQUE
);

-- Seed with the four core roles
INSERT INTO app.roles (role_id, name) VALUES
  (0, 'sys_admin'),
  (1, 'admin'),
  (2, 'user'),
  (3, 'viewer')
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
SELECT 0, perm_id FROM app.permissions  -- sys_admin: all perms
UNION ALL
-- admin defaults
SELECT 1, perm_id FROM app.permissions
 WHERE key IN (
   'create_user','update_user','delete_user',
   'create_org','update_org','delete_org','update_org_settings','view_audit_logs',
   'view_asset','create_asset','update_asset','delete_asset',
   'view_device','create_device','update_device','delete_device','assign_device'
 )
UNION ALL
-- user defaults
SELECT 2, perm_id FROM app.permissions
 WHERE key IN (
   'view_asset','create_asset','update_asset',
   'view_device','assign_device'
 )
UNION ALL
-- viewer defaults
SELECT 3, perm_id FROM app.permissions
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
  0,   -- sys_admin
  0    -- root organisation
)
ON CONFLICT (email) DO NOTHING;