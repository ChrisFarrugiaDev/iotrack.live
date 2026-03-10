export interface Group {
    id: string;
    uuid: string;
    organisation_id: string;
    name: string,
    type: string,
    items?: number,
    created_at: string | null; // timestamptz(6) — ISO string
    updated_at: string | null; // timestamptz(6) — ISO string
}