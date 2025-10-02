package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"math"
	"mime"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"

	"github.com/GoWebProd/uuid7"
	"github.com/go-chi/chi/v5"
	"github.com/h2non/bimg"
	"iotrack.live/file.server.go/internal/apptypes"
	"iotrack.live/file.server.go/internal/models"
)

type ImagesHandler struct {
	Uuid *uuid7.Generator
}

// Img Data Transfer Object Type
type ImageDTO struct {
	Filename string `json:"filename"`
	ImageID  string `json:"imageId,omitempty"`
	URL      string `json:"url,omitempty"`
	Error    string `json:"error,omitempty"`
}

const (
	UploadsImageRoot = "uploads/img"
	BaseImageUrl     = "img"
	MaxImageW        = 800
	MaxImageH        = 800
	JPEGQuality      = 100
	MaxImageSizeMB   = 8
	MaxPageLimit     = 100
	DefaultPageLimit = 20
	DefaultPage      = 1
)

var safeNameRe = regexp.MustCompile(`^[A-Za-z0-9][A-Za-z0-9_.-]*$`)

func (h *ImagesHandler) UploadMany(w http.ResponseWriter, r *http.Request) {
	// -----------------------------------------------------------------

	err := r.ParseMultipartForm(int64(MaxImageSizeMB * 1024 * 1024)) //max total size
	if err != nil {
		badRequest(w, "Invalid form", "INVALID_FORM", map[string]any{
			"hint": "expecting multipart/form-data",
		})
		return
	}
	// -----------------------------------------------------------------

	entityType := r.FormValue("entity_type")
	entityIdStr := r.FormValue("entity_id")

	if entityType == "" {
		badRequest(w, "Missing entity_type", "MISSING_FIELD", map[string]any{
			"field": "entity_type",
		})
		return
	}
	if entityIdStr == "" {
		badRequest(w, "Missing entity_id", "MISSING_FIELD", map[string]any{
			"field": "entity_id",
		})
		return
	}

	safeEntityId, err := strconv.ParseInt(entityIdStr, 10, 64)
	if err != nil {
		badRequest(w, "Invalid entity_id", "INVALID_FIELD", map[string]any{
			"field":     "entity_id",
			"entity_id": entityIdStr,
		})
		return
	}

	// Remove anything dangerous: .. or \
	safeEntityType := strings.Trim(filepath.Clean(entityType), "/\\")
	targetDir := filepath.Join(UploadsImageRoot, safeEntityType, entityIdStr)
	os.MkdirAll(targetDir, 0755)

	// -----------------------------------------------------------------

	files := r.MultipartForm.File["images"] // field name: images
	if files == nil {
		badRequest(w, "No files uploaded (field should be images[])", "NO_FILES", map[string]any{
			"field": "images",
		})
		return
	}

	// -----------------------------------------------------------------

	// Collect file info for response
	var (
		successes []ImageDTO
		failures  []ImageDTO
	)

	for _, fileHeader := range files {

		file, err := fileHeader.Open()

		if err != nil {
			failures = append(failures, ImageDTO{
				Filename: fileHeader.Filename,
				Error:    "cannot open file",
			})
			continue
		}
		defer file.Close()

		// ----------------------------------

		// Limit read size (defense in depth)
		raw, err := io.ReadAll(io.LimitReader(file, int64(MaxImageSizeMB*1024*1024)))
		if err != nil {
			failures = append(failures, ImageDTO{
				Filename: fileHeader.Filename,
				Error:    "cannot read file",
			})
			continue
		}

		// ----------------------------------

		// Use bimg for image processing
		img := bimg.NewImage(raw)

		// ----------------------------------

		// Check type
		imgType := bimg.DetermineImageTypeName(raw)
		if imgType != "jpeg" && imgType != "png" && imgType != "webp" {
			failures = append(failures, ImageDTO{
				Filename: fileHeader.Filename,
				Error:    "not an image",
			})
			continue
		}

		// ---------------------------------

		// Auto-convert to JPEG
		opts := bimg.Options{
			Quality: JPEGQuality,
			Type:    bimg.JPEG,
			// Compression:   1,
			StripMetadata: true,
			Interlace:     true,
		}

		// ---------------------------------

		// Resize if too big
		size, _ := img.Size()
		if size.Width > MaxImageW || size.Height > MaxImageH {
			// Calculate resize while maintaining aspect ratio
			scaleW := float64(MaxImageW) / float64(size.Width)
			scaleH := float64(MaxImageH) / float64(size.Height)
			scale := math.Min(scaleW, scaleH)

			newW := int(float64(size.Width) * scale)
			newH := int(float64(size.Height) * scale)

			opts.Width = newW
			opts.Height = newH
			opts.Force = false
			opts.Crop = false
			opts.Enlarge = false
		}

		// ---------------------------------

		finalImg, err := img.Process(opts)
		if err != nil {
			failures = append(failures, ImageDTO{
				Filename: fileHeader.Filename,
				Error:    "image processing error",
			})
			continue
		}

		// ---------------------------------

		// Save to disk
		imageId := h.Uuid.Next().String()
		outPath := filepath.Join(targetDir, imageId+".jpg")

		err = os.WriteFile(outPath, finalImg, 0644)

		if err != nil {
			failures = append(failures, ImageDTO{
				Filename: fileHeader.Filename,
				Error:    "cannot save file",
			})
			continue
		}

		// ---------------------------------
		webUrl := fmt.Sprintf("/%s/%s/%s/%s.jpg", BaseImageUrl, safeEntityType, entityIdStr, imageId)
		storagePath := fmt.Sprintf("%s/%s/%s/%s.jpg", UploadsImageRoot, safeEntityType, entityIdStr, imageId)
		mimeType := "image/jpeg"
		width := size.Width
		height := size.Height
		sizeBytes := int64(len(finalImg))

		userIDstr := r.Context().Value("userID").(string)
		userID, _ := strconv.ParseInt(userIDstr, 10, 64)

		imgModel := &models.Image{
			UUID:        imageId,
			EntityType:  entityType,
			EntityID:    safeEntityId,
			Filename:    fileHeader.Filename,
			StoragePath: storagePath,
			URL:         &webUrl,
			MimeType:    mimeType,
			WidthPx:     &width,
			HeightPx:    &height,
			SizeBytes:   &sizeBytes,
			//ChecksumSHA256: &checksum,
			Compressed: false,
			Encrypted:  false,
			IsPrimary:  false,
			Tags:       []string{},
			Attributes: map[string]interface{}{},
			UploadedBy: &userID,
		}

		// Save to DB
		imgModel, err = imgModel.Create(imgModel)
		if err != nil {
			failures = append(failures, ImageDTO{
				Filename: fileHeader.Filename,
				Error:    fmt.Sprintf("db error: %v", err),
			})
			continue
		}

		// ---------------------------------

		// Only if *everything* was successful:
		successes = append(successes, ImageDTO{
			Filename: fmt.Sprintf("%s.jpg", imageId),
			ImageID:  fmt.Sprintf("%d", imgModel.ID),
			URL:      webUrl,
		})

	}

	writeJSON(w, http.StatusOK, apptypes.APIResponse{
		Success: true,
		Message: "Upload complete",
		Data: map[string]any{
			"uploaded": successes,
			"errors":   failures,
		},
	})

}

func (h *ImagesHandler) DeleteMany(w http.ResponseWriter, r *http.Request) {
	type Request struct {
		EntityType string `json:"entity_type"`
		EntityId   int64  `json:"entity_id"`
	}

	var req Request

	// Parse and validate request body
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		badRequest(w, "Invalid request body. Please provide valid JSON with 'entity_type' and 'entity_id'.", "INVALID_JSON", map[string]any{
			"hint": "Body must be JSON with 'entity_type' (string) and 'entity_id' (integer).",
		})
		return
	}
	if req.EntityType == "" || req.EntityId == 0 {
		badRequest(w, "Missing 'entity_type' or 'entity_id'.", "MISSING_FIELD", nil)
		return
	}

	// Compose path for all images for this entity
	dirPath := fmt.Sprintf("%s/%s/%d", UploadsImageRoot, req.EntityType, req.EntityId)

	// Try to delete all files (ignore if directory is missing)
	err = os.RemoveAll(dirPath)
	if err != nil && !os.IsNotExist(err) {
		writeJSON(w, http.StatusInternalServerError, apptypes.APIResponse{
			Success: false,
			Message: "Failed to delete images from disk.",
			Error: &apptypes.APIError{
				Code:    "DELETE_FILES_FAILED",
				Details: map[string]interface{}{"error": err.Error(), "dir": dirPath},
			},
		})
		return
	}

	// Try to delete all DB records for this entity
	m := models.Image{}
	deletedCount, err := m.DeleteByEntity(req.EntityType, req.EntityId)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apptypes.APIResponse{
			Success: false,
			Message: "Failed to delete image records from database.",
			Error: &apptypes.APIError{
				Code:    "DELETE_DB_FAILED",
				Details: map[string]interface{}{"error": err.Error()},
			},
		})
		return
	}

	// Success!
	writeJSON(w, http.StatusOK, apptypes.APIResponse{
		Success: true,
		Message: fmt.Sprintf("Deleted %d images.", deletedCount),
		Data:    map[string]any{"deleted": deletedCount},
	})

}

func (h *ImagesHandler) DeleteOne(w http.ResponseWriter, r *http.Request) {

	// 1. Get image ID from URL path
	imageIdStr := chi.URLParam(r, "id")
	if imageIdStr == "" {
		badRequest(w, "Missing image id in URL path.", "MISSING_IMAGE_ID", nil)
		return
	}
	imageId, err := strconv.ParseInt(imageIdStr, 10, 64)
	if err != nil {
		badRequest(w, "Invalid image id in URL path.", "INVALID_IMAGE_ID", map[string]any{
			"example": "/img/images/12345",
		})
		return
	}

	m := models.Image{}

	// 2. Lookup the image in DB (for storage path)
	image, err := m.GetById(imageId)
	if err != nil {
		// If not found, return 404
		writeJSON(w, http.StatusNotFound, apptypes.APIResponse{
			Success: false,
			Message: "Image not found.",
			Error: &apptypes.APIError{
				Code:    "NOT_FOUND",
				Details: map[string]any{"image_id": imageId},
			},
		})
		return
	}

	// 3. Try to delete the file from disk (ignore if not found)
	path := image.StoragePath
	if path != "" {
		if err := os.Remove(path); err != nil && !os.IsNotExist(err) {
			// If file exists but can't be deleted, return 500
			writeJSON(w, http.StatusInternalServerError, apptypes.APIResponse{
				Success: false,
				Message: "Failed to delete image file from disk.",
				Error: &apptypes.APIError{
					Code:    "DELETE_FILE_FAILED",
					Details: map[string]any{"error": err.Error(), "path": path},
				},
			})
			return
		}
		// If file is already missing, continue to DB delete
	}

	// 4. Delete the record from DB
	deletedCount, err := m.DeleteById(imageId)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apptypes.APIResponse{
			Success: false,
			Message: "Failed to delete image from database.",
			Error: &apptypes.APIError{
				Code:    "DELETE_FAILED",
				Details: map[string]any{"error": err.Error()},
			},
		})
		return
	}

	// 5. If nothing was deleted (should never happen here), return 404
	if deletedCount == 0 {
		writeJSON(w, http.StatusNotFound, apptypes.APIResponse{
			Success: false,
			Message: "Image not found.",
			Error: &apptypes.APIError{
				Code:    "NOT_FOUND",
				Details: map[string]any{"image_id": imageId},
			},
		})
		return
	}

	// 6. Success!
	writeJSON(w, http.StatusOK, apptypes.APIResponse{
		Success: true,
		Message: "Image deleted.",
		Data:    map[string]any{"deleted": deletedCount},
	})
}

func (h *ImagesHandler) ServeByPath(w http.ResponseWriter, r *http.Request) {

	entityType := chi.URLParam(r, "entity_type")
	entityID := chi.URLParam(r, "entity_id")
	imgFile := chi.URLParam(r, "img_file")

	// Basic input validation to avoid weird characters / traversal

	if !safeNameRe.MatchString(entityType) || !safeNameRe.MatchString(entityID) || !safeNameRe.MatchString(imgFile) {
		http.Error(w, "invalid path params", http.StatusBadRequest)
		return
	}
	if strings.Contains(imgFile, "..") {
		http.Error(w, "invalid filename", http.StatusBadRequest)
		return
	}

	// -----------------------------------------------------------------
	// Build full path safely and ensure it's inside UploadsImageRoot

	base := filepath.Clean(UploadsImageRoot)
	fullPath := filepath.Clean(filepath.Join(base, entityType, entityID, imgFile))

	// Security check: ensure the resolved path is actually inside our UploadsImageRoot.
	if !strings.HasPrefix(fullPath, base+string(os.PathSeparator)) && fullPath != base {
		http.Error(w, "invalid path", http.StatusBadRequest)
		return
	}
	//  NOTE:  Using base + os.PathSeparator prevents false matches like "uploads/img_malicious".
	// Protects against directory traversal attempts (../../ etc).

	// -----------------------------------------------------------------
	// Stat the file (file info)

	fi, err := os.Stat(fullPath)
	if err != nil {
		if os.IsNotExist(err) {
			http.NotFound(w, r)
			return
		}
		http.Error(w, "failed to read file", http.StatusInternalServerError)
		return
	}

	if fi.IsDir() {
		http.NotFound(w, r)
		return
	}

	// -----------------------------------------------------------------
	// Compute a lightweight (weak) ETag based on mtime+size (fast; no hashing)

	etag := fmt.Sprintf(`W/"%x-%x"`, fi.ModTime().UnixNano(), fi.Size())

	// If-None-Match handling (allow simple list matching)
	ifNone := r.Header.Get("If-None-Match")

	if ifNone != "" {

		if strings.TrimSpace(ifNone) == "*" {
			w.WriteHeader(http.StatusNotModified)
			return
		}

		// Split on commas and trim
		for _, candidate := range strings.Split(ifNone, ",") {
			c := strings.TrimSpace(candidate)
			if c == etag || c == strings.TrimPrefix(etag, `W/`) {
				w.WriteHeader(http.StatusNotModified)
				return
			}
		}
	}

	// -----------------------------------------------------------------
	// MIME type (by extension)

	ctype := mime.TypeByExtension(strings.ToLower(filepath.Ext(fullPath)))
	if ctype == "" {
		// Fallback if unknown — let ServeFile still try; setting a generic type is okay.
		ctype = "application/octet-stream"
	}

	w.Header().Set("Content-Type", ctype)

	// -----------------------------------------------------------------
	// Caching headers

	w.Header().Set("ETag", etag)
	w.Header().Set("Last-Modified", fi.ModTime().UTC().Format(http.TimeFormat))
	w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")

	// Hardening: prevent weird filename chars in header
	safeFilename := sanitizeFilenameForHeader(imgFile)

	// Display inline with a friendly filename (optional)
	w.Header().Set("Content-Disposition", fmt.Sprintf(`inline; filename="%s"`, safeFilename))

	// Security: prevent MIME type sniffing, force browser to trust Content-Type
	w.Header().Set("X-Content-Type-Options", "nosniff")

	// ---- ------------------------------------------------------------
	// Serve the file (also handles HEAD + Range)
	http.ServeFile(w, r, fullPath)
}

func (h *ImagesHandler) List(w http.ResponseWriter, r *http.Request) {

	// Parse and validate query params
	q := r.URL.Query()
	entityType := strings.TrimSpace(q.Get("entity_type"))
	entityIdStr := strings.TrimSpace(q.Get("entity_id"))

	if entityType == "" || entityIdStr == "" {
		badRequest(w,
			"Missing required query params: entity_type and entity_id",
			"INVALID_PARAMS",
			map[string]any{
				"hint": "Provide both entity_type and entity_id in query string.",
			})
		return
	}

	if !safeNameRe.MatchString(entityType) {
		badRequest(w,
			"Invalid entity_type format",
			"INVALID_FORMAT",
			map[string]any{
				"hint": "Only alphanumeric, underscore, dash, and dot are allowed.",
			})
		return
	}

	entityID, err := strconv.ParseInt(entityIdStr, 10, 64)
	if err != nil {
		badRequest(w, "Invalid entity_id", "INVALID_FIELD", map[string]any{
			"field":     "entity_id",
			"entity_id": entityIdStr,
		})
		return
	}

	page, err := parsePositiveIntOrDefault(q.Get("page"), DefaultPage)
	if err != nil || page < 1 {
		badRequest(w, "Invalid page parameter", "INVALID_PAGE", nil)
		return
	}

	limit, err := parsePositiveIntOrDefault(q.Get("limit"), DefaultPageLimit)
	if err != nil || limit < 1 {
		badRequest(w, "Invalid limit parameter", "INVALID_LIMIT", nil)
		return
	}

	if limit > MaxPageLimit {
		limit = MaxPageLimit
	}
	offset := (page - 1) * limit

	m := models.Image{}

	images, err := m.GetByEntityLimitOffset(entityType, entityID, limit, offset)

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, apptypes.APIResponse{
			Success: false,
			Message: "Failed to fetch image records from database.",
			Error: &apptypes.APIError{
				Code:    "DB_FETCH_FAIL",
				Details: map[string]interface{}{"error": err.Error()},
			},
		})

		return
	}

	results := []ImageDTO{}

	for _, image := range images {
		filename := fmt.Sprintf("%s.jpg", image.UUID)

		var url string

		if image.URL != nil && *image.URL != "" {
			url = *image.URL
		} else {
			url = fmt.Sprintf("/%s/%s/%d/%s", BaseImageUrl, entityType, entityID, filename)
		}

		dto := ImageDTO{
			Filename: filename,
			ImageID:  fmt.Sprintf("%d", image.ID),
			URL:      url,
		}
		results = append(results, dto)
	}

	total, _ := m.CountByEntity(entityType, entityID)

	writeJSON(w, http.StatusOK, apptypes.APIResponse{
		Success: true,
		Message: "Images fetched",
		Data: map[string]any{
			"count":  int(total),
			"page":   page,
			"limit":  limit,
			"images": results,
		},
	})

}
