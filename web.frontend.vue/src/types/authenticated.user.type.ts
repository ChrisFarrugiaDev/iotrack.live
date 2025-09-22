export type AuthenticatedUser = {
    first_name: string;
    last_name: string;
    email: string;
    organisation: {
        id: string,
        uuid: string,
        name: string
    },
    role: {
        id: number,
        name: string,
    },
    accessible_devices: string[]
}