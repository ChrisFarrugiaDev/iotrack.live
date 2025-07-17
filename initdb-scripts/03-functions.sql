-- Utility function: automatically update 'updated_at' on any row update
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION check_device_asset_org_match()
RETURNS TRIGGER AS $$
BEGIN
    -- If asset_uuid is NOT NULL, check org UUIDs match
    IF NEW.asset_id IS NOT NULL THEN
        IF (SELECT organisation_id FROM app.assets WHERE id = NEW.asset_id) != NEW.organisation_id THEN
            RAISE EXCEPTION 'Device and assigned asset must belong to the same organization';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;