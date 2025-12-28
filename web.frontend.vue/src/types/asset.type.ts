export interface Asset {
  id: string; // int8(64,0)
  uuid: string; // uuid

  organisation_id: string 

  name: string 
  asset_type: string 
  devices: any[]
  vehicle?: any

  attributes: Record<string, any> | null; // jsonb

  created_at: string | null; // timestamptz(6) — ISO string
  updated_at: string | null; // timestamptz(6) — ISO string
}