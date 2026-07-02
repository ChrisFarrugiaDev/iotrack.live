import { OrganisationType } from "../../models/organisation.model";
import * as redisUtils from "../../utils/redis.utils";

// ---------------------------------------------------------------------



export async function organisationToPublic(org: OrganisationType) {

    const parent_org = await redisUtils.hget('organisations', org.parent_org_id ?? "", 'iotrack.live:');

    let parent_org_name = "";

    if (parent_org) { parent_org_name = parent_org.name }


    return {
        attributes: org.attributes,
        can_inherit_maps_key: org.can_inherit_maps_key,
        can_inherit_ai_key: org.can_inherit_ai_key,
        id: org.id?.toString?.() ?? org.id,
        name: org.name,
        parent_org_name,
        parent_org_id: org.parent_org_id,
        path: org.path,
        uuid: org.uuid,
        created_at: org.created_at,
    }
}