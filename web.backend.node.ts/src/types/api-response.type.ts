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