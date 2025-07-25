export type ApiSuccessResponse<T = undefined> = {
    success: true;
    message: string;
    data?: T;
}

// ---------------------------------------------------------------------

export type ApiErrorResponse = {
    success: false;
    error: string;
    details?: string;
}



export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details?: Record<string, any>;
  };
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
