export interface User {
  id: string;                           // serial / numeric ID
  uuid: string;                         // uuid identifier

  first_name: string;                   // varchar(255)
  last_name: string;                    // varchar(255)
  email: string;                        // varchar(255)

  role_id: number | null;               // integer FK
  organisation_id: string | null;       // varchar or uuid FK

  active: boolean;                      // user active status
  last_login_at: string | null;         // timestamptz(6) — ISO string

  created_at?: string | null;           // optional timestamps
  updated_at?: string | null;           // optional timestamps
}
