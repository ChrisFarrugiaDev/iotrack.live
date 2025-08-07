export interface Device {
    id: string; // could be string (UUID) or number (db ID)
    uuid: string;
    organisation_id: string;
    asset_id: string | null;
    description: string;
    external_id: string;
    external_id_type: string;
    model: string;
    protocol: string;
    registered_at: Date; 
    updated_at: Date;    
    status: string;
    vendor: string;
}