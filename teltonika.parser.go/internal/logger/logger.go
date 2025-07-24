package logger

import (
	"fmt"
	"os"

	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"gopkg.in/natefinch/lumberjack.v2"
)

var Log *zap.Logger

func InitLogger() *zap.Logger {
	var logger *zap.Logger
	mode := os.Getenv("LOG_MODE")

	switch mode {
	case "file":
		// Lumberjack config for file rotation
		lumberjackLogger := &lumberjack.Logger{
			Filename:   "teltonika-parser-go.log",
			MaxSize:    100,  // megabytes
			MaxBackups: 3,    // number of old files to keep
			MaxAge:     28,   // days
			Compress:   true, // compress rotated files
		}

		encoderConfig := zap.NewProductionEncoderConfig()
		encoderConfig.EncodeTime = zapcore.ISO8601TimeEncoder

		core := zapcore.NewCore(
			zapcore.NewJSONEncoder(encoderConfig),
			zapcore.AddSync(lumberjackLogger),
			zap.InfoLevel,
		)
		logger = zap.New(core, zap.AddCaller(), zap.AddStacktrace(zapcore.ErrorLevel), zap.AddCallerSkip(1))

	case "off":
		logger = zap.NewNop()

	default:
		config := zap.NewDevelopmentConfig()
		l, err := config.Build(zap.AddCallerSkip(1))
		if err != nil {
			fmt.Printf("Error initializing logger: %v\n", err)
			os.Exit(1)
		}
		logger = l
	}

	Log = logger

	return Log
}

func Info(msg string, fields ...zap.Field) {
	Log.Info(msg, fields...)
}

func Warn(msg string, fields ...zap.Field) {
	Log.Warn(msg, fields...)
}

func Error(msg string, fields ...zap.Field) {
	Log.Error(msg, fields...)
}

func Debug(msg string, fields ...zap.Field) {
	Log.Debug(msg, fields...)
}
