import { UserType } from "../../models/user.model";


export function userToPublic(user: UserType) {

    return {
        id: user.id?.toString?.() ?? user.id,
        uuid: user.uuid,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role_id: user.role_id,
        organisation_id: user.organisation_id?.toString?.() ?? user.organisation_id,
        active: user.active,
        last_login_at: user.last_login_at,
    }
}