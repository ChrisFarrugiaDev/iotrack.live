export interface Device {
  id: number; // int8(64,0)
  uuid: string; // uuid

  organisation_id: number | null; // int8(64,0)
  asset_id: number | null; // int8(64,0)

  external_id: string | null; // varchar(64)
  external_id_type: string | null; // varchar(16)

  protocol: string | null; // varchar(32)
  vendor: string | null; // varchar(64)
  model: string | null; // varchar(64)
  status: string | null; // varchar

  attributes: Record<string, any> | null; // jsonb

  last_telemetry: Record<string, any> | null; // jsonb
  last_telemetry_ts: string | null; // timestamptz(6) — ISO string

  created_at: string | null; // timestamptz(6) — ISO string
  updated_at: string | null; // timestamptz(6) — ISO string
}
