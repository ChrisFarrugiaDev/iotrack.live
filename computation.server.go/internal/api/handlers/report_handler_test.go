package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"iotrack.live/computation.server.go/internal/api/middlewares"
	"iotrack.live/computation.server.go/internal/services"
)

// fakeGenerator lets the tests drive every branch of the error-mapping
// switch without a database.
type fakeGenerator struct {
	result  *services.ActivityReportResult
	err     error
	lastReq services.ActivityReportRequest
	calls   int
}

func (f *fakeGenerator) GenerateActivityReport(_ context.Context, req services.ActivityReportRequest) (*services.ActivityReportResult, error) {
	f.calls++
	f.lastReq = req
	return f.result, f.err
}

func post(t *testing.T, h *ReportHandler, body string) *httptest.ResponseRecorder {
	t.Helper()

	req := httptest.NewRequest(http.MethodPost, "/activity", strings.NewReader(body))
	req = req.WithContext(middlewares.WithIdentity(req.Context(), 7, 2, 3))
	rec := httptest.NewRecorder()

	h.ActivityReport(rec, req)
	return rec
}

func errorCode(t *testing.T, rec *httptest.ResponseRecorder) string {
	t.Helper()

	var body struct {
		Error struct {
			Code string `json:"code"`
		} `json:"error"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decoding body: %v", err)
	}
	return body.Error.Code
}

const validBody = `{"asset_uuid":"a-uuid","from":"2026-07-12T00:00:00Z","to":"2026-07-12T23:59:59Z"}`

// The validation table: everything here must be rejected before the service
// is ever called — this pins the §34 error contract the frontend depends on.
func TestActivityReportValidation(t *testing.T) {
	cases := []struct {
		name string
		body string
	}{
		{"not json", `not json at all`},
		{"missing asset_uuid", `{"from":"2026-07-12T00:00:00Z","to":"2026-07-12T23:59:59Z"}`},
		{"missing from", `{"asset_uuid":"x","to":"2026-07-12T23:59:59Z"}`},
		{"missing to", `{"asset_uuid":"x","from":"2026-07-12T00:00:00Z"}`},
		{"unparseable date", `{"asset_uuid":"x","from":"12/07/2026","to":"2026-07-12T23:59:59Z"}`},
		{"from equals to", `{"asset_uuid":"x","from":"2026-07-12T00:00:00Z","to":"2026-07-12T00:00:00Z"}`},
		{"from after to", `{"asset_uuid":"x","from":"2026-07-13T00:00:00Z","to":"2026-07-12T00:00:00Z"}`},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			gen := &fakeGenerator{}
			rec := post(t, NewReportHandler(gen, 1), tc.body)

			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want 400", rec.Code)
			}
			if code := errorCode(t, rec); code != "REPORT_VALIDATION_ERROR" {
				t.Fatalf("code = %s, want REPORT_VALIDATION_ERROR", code)
			}
			if gen.calls != 0 {
				t.Fatalf("service called %d times on invalid input, want 0", gen.calls)
			}
		})
	}
}

// The error-mapping table: each typed service error must come out as the
// §34 status + code pair.
func TestActivityReportErrorMapping(t *testing.T) {
	cases := []struct {
		name       string
		err        error
		wantStatus int
		wantCode   string
	}{
		{"asset not found", fmt.Errorf("wrapped: %w", services.ErrAssetNotFound), http.StatusNotFound, "ASSET_NOT_FOUND"},
		{"access denied", fmt.Errorf("wrapped: %w", services.ErrAssetAccessDenied), http.StatusForbidden, "ASSET_ACCESS_DENIED"},
		{"range too long", fmt.Errorf("wrapped: %w", services.ErrRangeTooLong), http.StatusBadRequest, "REPORT_VALIDATION_ERROR"},
		{"unexpected error", errors.New("db exploded"), http.StatusInternalServerError, "SERVER_ERROR"},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			rec := post(t, NewReportHandler(&fakeGenerator{err: tc.err}, 1), validBody)

			if rec.Code != tc.wantStatus {
				t.Fatalf("status = %d, want %d", rec.Code, tc.wantStatus)
			}
			if code := errorCode(t, rec); code != tc.wantCode {
				t.Fatalf("code = %s, want %s", code, tc.wantCode)
			}
		})
	}
}

func TestActivityReportSuccess(t *testing.T) {
	gen := &fakeGenerator{result: &services.ActivityReportResult{RawPointCount: 42}}
	rec := post(t, NewReportHandler(gen, 1), validBody)

	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want 200", rec.Code)
	}

	var body struct {
		Success bool `json:"success"`
		Data    struct {
			RawPointCount int `json:"rawPointCount"`
		} `json:"data"`
	}
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("decoding body: %v", err)
	}
	if !body.Success || body.Data.RawPointCount != 42 {
		t.Fatalf("body = %+v, want success with rawPointCount 42", body)
	}

	// Identity must come from the JWT context, never the request body (§20),
	// and timestamps must arrive at the service in UTC.
	if gen.lastReq.UserID != 7 || gen.lastReq.OrgID != 3 {
		t.Fatalf("service got user %d org %d, want 7 and 3", gen.lastReq.UserID, gen.lastReq.OrgID)
	}
	if gen.lastReq.From.Location() != gen.lastReq.From.UTC().Location() {
		t.Fatal("From must be UTC")
	}
}
