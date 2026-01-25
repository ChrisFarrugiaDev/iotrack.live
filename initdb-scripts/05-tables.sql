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
  description TEXT        NOT NULL,
  group_name  TEXT        -- nullable, e.g. 'user', 'org', 'device'
);

-- 2. Seed it with your initial permissions
INSERT INTO app.permissions (perm_id, key, description, group_name) VALUES
  ( 1,  'user.view',             'View users',                    'user'   ),
  ( 2,  'user.create',           'Create new users',              'user'   ),
  ( 3,  'user.update',           'Update existing users',         'user'   ),
  ( 4,  'user.delete',           'Delete users',                  'user'   ),

  ( 5,  'org.view',              'View organisations',            'organisations' ),
  ( 6,  'org.switch',            'Switch organisation',           'organisations' ),
  ( 7,  'org.create',            'Create new organisations',      'organisations' ),
  ( 8,  'org.update',            'Update existing organisations', 'organisations' ),
  ( 9,  'org.delete',            'Delete organisations',          'organisations' ),

  (10,  'audit.view',            'View system audit logs',        'admin'  ),

  (11,  'asset.view',            'View assets',                   'asset'  ),
  (12,  'asset.create',          'Create new assets',             'asset'  ),
  (13,  'asset.update',          'Update existing assets',        'asset'  ),
  (14,  'asset.delete',          'Delete assets',                 'asset'  ),

  (15,  'device.view',           'View devices',                  'device' ),
  (16,  'device.create',         'Create new devices',            'device' ),
  (17,  'device.update',         'Update existing devices',       'device' ),
  (18,  'device.delete',         'Delete devices',                'device' ),
  (19,  'device.assign',         'Assign devices to assets',      'device' )
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
--    sys_admin (1) gets every permission,
--    admin     (2) gets most organisation/admin perms,
--    user      (3) gets asset/device create/update/view,
--    viewer    (4) gets view-only perms.

INSERT INTO app.role_permissions (role_id, perm_id)
-- sys_admin: all perms
SELECT 1, perm_id FROM app.permissions
UNION ALL
-- admin defaults
SELECT 2, perm_id FROM app.permissions
 WHERE key IN (
   'user.view','user.create','user.update','user.delete',
   'org.view','org.switch','org.create','org.update','org.delete',
   'audit.view',
   'asset.view','asset.create','asset.update','asset.delete',
   'device.view','device.create','device.update','device.delete','device.assign'
 )
UNION ALL
-- user defaults
SELECT 3, perm_id FROM app.permissions
 WHERE key IN (
   'org.view','org.switch',
   'asset.view','asset.create','asset.update',
   'device.view','device.assign'
 )
UNION ALL
-- viewer defaults
SELECT 4, perm_id FROM app.permissions
 WHERE key IN (
   'org.view',
   'asset.view','device.view'
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
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    token_version    INTEGER      NOT NULL DEFAULT 1                     -- used for JWT/session invalidation
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
  user_id         BIGINT      NOT NULL
    REFERENCES app.users(id) ON DELETE CASCADE,
  organisation_id BIGINT      NOT NULL
    REFERENCES app.organisations(id) ON DELETE CASCADE,
  is_allowed      BOOLEAN     NOT NULL DEFAULT TRUE,
  PRIMARY KEY (user_id, organisation_id)
);


CREATE OR REPLACE VIEW app.user_organisation_access_view AS
SELECT
    uoa.user_id,
    u.email              AS user_email,
    u.first_name,
    u.last_name,
    uoa.organisation_id,
    o.uuid               AS organisation_uuid,
    o.name               AS organisation_name,
    uoa.is_allowed
FROM
    app.user_organisation_access uoa
    JOIN app.users u
      ON u.id = uoa.user_id
    JOIN app.organisations o
      ON o.id = uoa.organisation_id
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

CREATE TABLE app.images (
    id               BIGSERIAL PRIMARY KEY,
    uuid             UUID UNIQUE DEFAULT gen_random_uuid(),

    -- Polymorphic association (entity_type + entity_id)
    entity_type      VARCHAR(32) NOT NULL,
    entity_id        BIGINT      NOT NULL,

    -- File metadata
    filename         VARCHAR(255) NOT NULL,        -- original filename
    storage_path     TEXT         NOT NULL,        -- e.g. uploads/images/asset/123/uuid.jpg
    url              TEXT,                        -- if you expose via web

    mime_type        VARCHAR(64)  NOT NULL DEFAULT 'image/jpeg',
    width_px         INT,
    height_px        INT,
    size_bytes       BIGINT,

    -- Image processing info
    compressed       BOOLEAN      NOT NULL DEFAULT FALSE,
    encrypted        BOOLEAN      NOT NULL DEFAULT FALSE,
    checksum_sha256  VARCHAR(64),                  -- integrity or dedup
    is_primary       BOOLEAN      NOT NULL DEFAULT FALSE,
    tags             TEXT[],
    attributes       JSONB        NOT NULL DEFAULT '{}',

    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    uploaded_by      BIGINT                      -- user_id, FK if you want
  
);

CREATE INDEX ix_images_entity ON app.images (entity_type, entity_id);


CREATE TABLE app.files (
    id               BIGSERIAL PRIMARY KEY,
    uuid             UUID UNIQUE DEFAULT gen_random_uuid(),

    entity_type      VARCHAR(32) NOT NULL,
    entity_id        BIGINT      NOT NULL,

    filename         VARCHAR(255) NOT NULL,        -- original filename
    storage_path     TEXT         NOT NULL,        -- e.g. uploads/files/asset/123/uuid.pdf
    url              TEXT,                        -- if exposed via web

    mime_type        VARCHAR(64)  NOT NULL,
    size_bytes       BIGINT,

    compressed       BOOLEAN      NOT NULL DEFAULT FALSE,
    encrypted        BOOLEAN      NOT NULL DEFAULT FALSE,
    checksum_sha256  VARCHAR(64),

    -- FOTA/config specific
    file_type         VARCHAR(32),                  -- e.g. 'fota', 'config', 'manual'
    attributes       JSONB        NOT NULL DEFAULT '{}',

    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    uploaded_by      BIGINT                      -- user_id, FK if needed

);
CREATE INDEX ix_files_entity ON app.files (entity_type, entity_id);


-- ---------------------------------------------------------------------


CREATE TABLE IF NOT EXISTS app.user_permissions (
  user_id   BIGINT     NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  perm_id   SMALLINT   NOT NULL REFERENCES app.permissions(perm_id) ON DELETE CASCADE,
  is_allowed BOOLEAN   NOT NULL DEFAULT TRUE, -- TRUE=grant, FALSE=deny
  PRIMARY KEY (user_id, perm_id)
);

CREATE OR REPLACE VIEW app.user_permissions_view AS
SELECT
    up.user_id,
    u.email           AS user_email,
    up.perm_id,
    p.key             AS perm_key,
    up.is_allowed
FROM
    app.user_permissions up
    JOIN app.users u
      ON u.id = up.user_id
    JOIN app.permissions p
      ON p.perm_id = up.perm_id
ORDER BY
    u.email, p.key;