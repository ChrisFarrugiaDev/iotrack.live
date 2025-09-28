package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/GoWebProd/uuid7"
	"github.com/h2non/bimg"
	"iotrack.live/file.server.go/internal/apptypes"
	"iotrack.live/file.server.go/internal/models"
)

type ImagesHandler struct {
	Uuid *uuid7.Generator
}

type ImageUploadResult struct {
	Filename string `json:"filename"`
	ImageID  string `json:"imageId,omitempty"`
	URL      string `json:"url,omitempty"`
	Error    string `json:"error,omitempty"`
}

const (
	UploadsRoot   = "uploads/images"
	BaseUrl       = "image"
	MaxImageW     = 1600
	MaxImageH     = 1600
	JPEGQuality   = 82
	MaxFileSizeMB = 8
)

func (h *ImagesHandler) UploadManyImages(w http.ResponseWriter, r *http.Request) {

	// -----------------------------------------------------------------

	err := r.ParseMultipartForm(int64(MaxFileSizeMB * 1024 * 1024)) //max total size
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
	targetDir := filepath.Join(UploadsRoot, safeEntityType, entityIdStr)
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
		successes []ImageUploadResult
		failures  []ImageUploadResult
	)

	for _, fileHeader := range files {

		file, err := fileHeader.Open()

		if err != nil {
			failures = append(failures, ImageUploadResult{
				Filename: fileHeader.Filename,
				Error:    "cannot open file",
			})
			continue
		}
		defer file.Close()

		// ----------------------------------

		// Limit read size (defense in depth)
		raw, err := io.ReadAll(io.LimitReader(file, int64(MaxFileSizeMB*1024*1024)))
		if err != nil {
			failures = append(failures, ImageUploadResult{
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
			failures = append(failures, ImageUploadResult{
				Filename: fileHeader.Filename,
				Error:    "not an image",
			})
			continue
		}

		// ---------------------------------

		// Auto-convert to JPEG
		opts := bimg.Options{
			Quality:       JPEGQuality,
			Type:          bimg.JPEG,
			Compression:   1,
			StripMetadata: true,
			Interlace:     true,
		}

		// ---------------------------------

		// Resize if too big
		size, _ := img.Size()
		if size.Width > MaxImageW || size.Height > MaxImageH {
			opts.Width = MaxImageW
			opts.Height = MaxImageH
			opts.Force = false // keep aspect
		}

		// ---------------------------------

		finalImg, err := img.Process(opts)
		if err != nil {
			failures = append(failures, ImageUploadResult{
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
			failures = append(failures, ImageUploadResult{
				Filename: fileHeader.Filename,
				Error:    "cannot save file",
			})
			continue
		}

		// ---------------------------------
		webUrl := fmt.Sprintf("/%s/%s/%s/%s.jpg", BaseUrl, safeEntityType, entityIdStr, imageId)
		storagePath := fmt.Sprintf("%s/%s/%s.jpg", safeEntityType, entityIdStr, imageId)
		mimeType := "image/jpeg"
		width := size.Width
		height := size.Height
		sizeBytes := int64(len(finalImg))

		imgModel := models.Image{
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
		}

		// Save to DB
		_, err = imgModel.Create(&imgModel)
		if err != nil {
			failures = append(failures, ImageUploadResult{
				Filename: fileHeader.Filename,
				Error:    fmt.Sprintf("db error: %v", err),
			})
			continue
		}

		// ---------------------------------

		// Only if *everything* was successful:
		successes = append(successes, ImageUploadResult{
			Filename: fileHeader.Filename,
			ImageID:  imageId,
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
