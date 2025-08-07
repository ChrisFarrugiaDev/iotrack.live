export interface Asset {
    id: string;
    uuid: string;
    organisation_id: string;
    asset_type: string;
    name: string;
    description: string;
    created_at: Date;
    updated_at: Date;
}