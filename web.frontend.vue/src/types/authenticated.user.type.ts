export type AuthenticatedUser = {
    first_name: string;
    last_name: string;
    email: string;
    role: {
        id: number,
        name: string,
    }
}