export type ApiSuccessResponse<T = undefined> = {
    success: true;
    message: string;
    data?: T;
}

export type ApiErrorResponse = {
    success: false;
    error: string;
    details?: string;
}

export type Codec12Command = {
    id: string;
    imei: string;
    command: string;
    status: string; // e.g. "pending", "sent", "responded", "failed"
    created_at: Date;       // ISO8601 string in UTC, e.g. "2024-06-19T14:31:00Z"
    sent_at: Date | null;         // same as above, optional
    responded_at: Date | null;    // same as above, optional
    response: string | null;
    retries: number;
    comment: string | null;         // optional, for notes/description
};
