-- --------------------------------------------------------------------
-- Utility function: automatically update 'updated_at' on any row update.
-- Use in triggers: sets NEW.updated_at = NOW() before every UPDATE.
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- Trigger function: ensures that, if a device is assigned to an asset,
-- both device and asset must belong to the same organisation.
-- If not, raises an exception to block the change.
CREATE OR REPLACE FUNCTION check_device_asset_org_match()
RETURNS TRIGGER AS $$
BEGIN
    -- If asset_id is NOT NULL, check org IDs match
    IF NEW.asset_id IS NOT NULL THEN
        IF (SELECT organisation_id FROM app.assets WHERE id = NEW.asset_id) != NEW.organisation_id THEN
            RAISE EXCEPTION 'Device and assigned asset must belong to the same organization';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- Trigger function: sets or updates the materialized path of an organisation
-- on INSERT or UPDATE. The path is a comma-separated list of ancestor IDs.
-- If the org has no parent, path = id. Otherwise, parent.path || ',' || id.
CREATE OR REPLACE FUNCTION app.set_organisation_path()
RETURNS TRIGGER AS $$
DECLARE
    parent_path TEXT;
BEGIN
    IF NEW.parent_org_id IS NULL THEN
        NEW.path := NEW.id::TEXT;
    ELSE
        SELECT path INTO parent_path FROM app.organisations WHERE id = NEW.parent_org_id;
        IF parent_path IS NULL THEN
            -- parent might not have its path set yet, fallback to just parent + self
            NEW.path := NEW.parent_org_id::TEXT || ',' || NEW.id::TEXT;
        ELSE
            NEW.path := parent_path || ',' || NEW.id::TEXT;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------------------------------
-- Helper function (call from app): recursively updates the `path` value
-- for all descendant organisations of a given root org after a move.
-- Use this after changing an org's parent_org_id to keep descendant paths in sync.
CREATE OR REPLACE FUNCTION app.update_org_descendant_paths(root_id BIGINT)
RETURNS VOID AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN
        WITH RECURSIVE descendants AS (
            SELECT id, parent_org_id, path
            FROM app.organisations
            WHERE parent_org_id = root_id
            UNION ALL
            SELECT o.id, o.parent_org_id, o.path
            FROM app.organisations o
            INNER JOIN descendants d ON o.parent_org_id = d.id
        )
        SELECT id FROM descendants
    LOOP
        -- For each descendant, update its path based on its parent's current path
        UPDATE app.organisations AS child
        SET path = (SELECT parent.path || ',' || child.id::TEXT
                    FROM app.organisations parent
                    WHERE parent.id = child.parent_org_id)
        WHERE child.id = rec.id;

        -- Recursively update that child's descendants
        PERFORM app.update_org_descendant_paths(rec.id);
    END LOOP;
END;
$$ LANGUAGE plpgsql;



-- After changing parent_org_id of an org, run:
--   SELECT app.update_org_descendant_paths(<org_id>);
-- This will fix path for all children/grandchildren/etc.

-- --------------------------------------------------------------------
