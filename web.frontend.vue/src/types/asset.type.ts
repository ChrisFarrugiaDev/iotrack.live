export interface Asset {
  id: number; // int8(64,0)
  uuid: string; // uuid

  organisation_id: number 

  name: string 
  asset_type: string 

  attributes: Record<string, any> | null; // jsonb

  created_at: string | null; // timestamptz(6) — ISO string
  updated_at: string | null; // timestamptz(6) — ISO string
}