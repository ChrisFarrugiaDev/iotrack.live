# Using the Custom Logger

This project uses [Uber Zap](https://github.com/uber-go/zap) for fast, structured logging.  
**Use the logger instead of** `**fmt.Println**`**,** `**fmt.Printf**`**, or Go’s** `**log**` **package.**

## **How to Use**

### **Initialization (in main.go)**

```
import "your-module/logger"

func main() {
    logger.InitLogger()
    defer logger.Log.Sync() // Ensures logs are flushed on exit

    logger.Info("App started")
}
```

---

## **Logging Basics**

### **Info**

```go
logger.Info("Server started") // Just a message

logger.Info("Connected to database",
    zap.String("db", "postgres"),
    zap.Bool("ssl", true),
)
```

### **Warn**

```
logger.Warn("Unexpected input")
```

### **Error**

```go
err := someFunction()
if err != nil {
    logger.Error("Failed to run someFunction", zap.Error(err))
}
```

### **Debug**

(Shows in terminal/dev mode, not file mode unless you change log level)

```go
logger.Debug("Payload received", zap.ByteString("payload", data))
```

---

## **How Does This Compare to fmt/log?**

|Classic|With This Logger|Notes|
|---|---|---|
|`fmt.Println`|`logger.Info("message")`|Use for standard info|
|`fmt.Printf`|`logger.Info("User: %s", ...)`|Use Zap fields instead of formatting|
|`log.Println`|`logger.Warn("message")`|Use for warnings|
|`log.Fatal`|`logger.Error("fatal", ...)`|Use Error for errors|

---

## **Log Fields (Structured Logging)**

Zap lets you add fields to every log entry, so logs are searchable and parsable.

|   |   |
|---|---|
|Type|How to Add Field|
|String|`zap.String("key", "value")`|
|Integer|`zap.Int("key", 123)`|
|Boolean|`zap.Bool("key", true)`|
|Error|`zap.Error(err)`|
|Any (object)|`zap.Any("key", obj)`|
|Bytes|`zap.ByteString("key", data)`|
|Duration|`zap.Duration("elapsed", time.Since(start))`|

---

## **Examples**

```go
logger.Info("Request received",
    zap.String("method", "POST"),
    zap.String("path", "/api/devices"),
    zap.Int("status", 200),
)

logger.Warn("Suspicious input",
    zap.String("user_agent", ua),
    zap.String("input", input),
)

logger.Error("DB query failed",
    zap.Error(err),
    zap.String("query", sql),
)

logger.Debug("Decoded packet", zap.Any("packet", packet))
```

---

## **Remember**

- **Always** initialize the logger before logging.
    
- **Call** `defer logger.Log.Sync()` in main to flush logs before exit.
    
- **Do not use** `fmt.Println`, `fmt.Printf`, or `log.Println` for app logs—use this logger!
    

---

**Want more field types?** See the Zap docs or ask for more examples!