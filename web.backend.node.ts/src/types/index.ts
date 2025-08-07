export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: Record<string, any>;
    error?: any
  };
}

/* go version:
// Common struct for JSON responses
type APIResponse struct {
    Success bool        `json:"success"`
    Message string      `json:"message"`
    Data    interface{} `json:"data,omitempty"`
    Error   *APIError   `json:"error,omitempty"`
}

type APIError struct {
    Code    string                 `json:"code"`
    Details map[string]interface{} `json:"details,omitempty"`
}
*/

// ---------------------------------------------------------------------

interface JwtPayload {
  sub: string;            // user id (UUID or string)
  org_id?: string;
  role: string;
  iat?: number;
  exp?: number;
}
// ---------------------------------------------------------------------

export type TeltonikaCodec12Command = {
    id: string;
    imei: string;
    command: string;
    status: string; // e.g. "pending", "sent", "responded", "failed"
    created_at: Date;               // ISO8601 string in UTC, e.g. "2024-06-19T14:31:00Z"
    updated_at: Date;            // same as above
    sent_at: Date | null;           // same as above, optional
    responded_at: Date | null;      // same as above, optional
    response: string | null;
    retries: number;
    comment: string | null;         // optional, for notes/description
};
