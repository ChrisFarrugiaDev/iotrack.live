package main

import (
	"os"
	"path/filepath"
	"testing"

	"iotrack.live/teltonika.parser.go/internal/logger"
)

func Test_loadEnv(t *testing.T) {
	oldEnvPath := envPath
	t.Cleanup(func() {
		envPath = oldEnvPath
	})

	envPath = testEnvPath(t)
	t.Run("basic env load", func(t *testing.T) {
		clearEnvForLoadEnvTest(t)

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
			clearEnvForLoadEnvTest(t)

			// Set up the test environment
			os.Setenv("GO_ENV", tt.goEnv)

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

func testEnvPath(t *testing.T) string {
	t.Helper()

	dir := t.TempDir()
	files := map[string]string{
		".env":             "LOG_MODE=file\n",
		".env.development": "LOG_MODE=default\n",
	}

	for name, content := range files {
		path := filepath.Join(dir, name)
		if err := os.WriteFile(path, []byte(content), 0644); err != nil {
			t.Fatalf("failed to write test env file %s: %v", path, err)
		}
	}

	return dir + string(os.PathSeparator)
}

func clearEnvForLoadEnvTest(t *testing.T) {
	t.Helper()

	envKeys := []string{"DOCKERIZED", "GO_ENV", "LOG_MODE"}
	oldValues := make(map[string]string, len(envKeys))
	wasSet := make(map[string]bool, len(envKeys))

	for _, key := range envKeys {
		oldValues[key], wasSet[key] = os.LookupEnv(key)
		os.Unsetenv(key)
	}

	t.Cleanup(func() {
		for _, key := range envKeys {
			if wasSet[key] {
				os.Setenv(key, oldValues[key])
			} else {
				os.Unsetenv(key)
			}
		}
	})
}

func Test_initializeCache(t *testing.T) {
	if os.Getenv("RUN_REDIS_TESTS") != "1" {
		t.Skip("set RUN_REDIS_TESTS=1 to run Redis integration tests")
	}

	loadEnv()

	logger.InitLogger()
	defer logger.Log.Sync()

	defer func() {
		if r := recover(); r != nil {
			t.Errorf("Function panicked: %v", r)
		}
	}()

	env := map[string]string{
		"REDIS_HOST":         "127.0.0.1",
		"REDIS_PORT":         "16379",
		"REDIS_DB":           "2",
		"REDIS_CACHE_EXPIRE": "3600",
	}
	for k, v := range env {
		t.Setenv(k, v)
	}

	initializeCache()

	if app.Cache != nil {
		defer app.Cache.Close()
	}
}
