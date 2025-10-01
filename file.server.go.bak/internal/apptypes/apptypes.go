package apptypes

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

type ImageUploadResult struct {
	Filename string `json:"filename"`
	ImageID  string `json:"imageId,omitempty"`
	URL      string `json:"url,omitempty"`
	Error    string `json:"error,omitempty"`
}
