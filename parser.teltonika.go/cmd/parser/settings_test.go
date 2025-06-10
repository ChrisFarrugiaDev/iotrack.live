package main

import (
	"os"
	"testing"
)

func Test_loadEnv(t *testing.T) {
	envPath = "../../"
	t.Run("basic env load", func(t *testing.T) {

		err := loadEnv()
		if err != nil {
			t.Fatalf("loadEnv() failed: %v", err)
		}
	})

	// Table-driven tests for different environments
	tests := []struct {
		name        string
		goEnv       string
		wantLogMode string
	}{
		{
			name:        "production environment",
			goEnv:       "production",
			wantLogMode: "file",
		},
		{
			name:        "development environment",
			goEnv:       "development",
			wantLogMode: "default",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {

			// Set up the test environment
			os.Setenv("GO_ENV", tt.goEnv)

			// Clear any existing LOG_MODE that might be set
			os.Unsetenv("LOG_MODE")

			// Run the function we're testing
			loadEnv()

			// Check the results
			got := os.Getenv("LOG_MODE")

			if got != tt.wantLogMode {
				t.Errorf("LOG_MODE is '%s', expected '%s'", got, tt.wantLogMode)
			}
		})
	}
}
