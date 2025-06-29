# JWT Structure and Time-Based Access Control in Go + PostgreSQL


## 🧠 Overview

This guide defines best practices for using JWTs in systems with:

- Organizational access control
- Time-restricted login windows (e.g., Monday to Friday, 07:00–19:00)
- Passive client-side polling to check ongoing access

---

## 🪪 JWT Payload — What to Include

**DO include (minimal & identity-focused):**

```json
{
  "sub": "user-uuid",
  "org_id": "org-uuid",
  "role": "viewer",
  "iat": 1710000000,
  "exp": 1710003600
}

```


|Field|Description|
|---|---|
|`sub`|User ID (subject)|
|`org_id`|Organization ID the user belongs to|
|`role`|Optional: used for UI control or backend authorization|
|`iat`|Issued at time|
|`exp`|Expiry time|

**❌ DO NOT store:**

- Asset IDs
    
- Access time rules
    
- Permissions
    
- UI configuration  
    These should be enforced or retrieved **dynamically**.
    

---

## 🕒 Time-Based Access Control Rules

Each user may have allowed **access days and hours**, for example:

- Monday to Friday
    
- From 07:00 to 19:00 server time
    

### 📦 PostgreSQL User Fields

```sql
ALTER TABLE auth.users
ADD COLUMN access_start TIME DEFAULT '07:00',
ADD COLUMN access_end TIME DEFAULT '19:00',
ADD COLUMN access_days INT[] DEFAULT ARRAY[1,2,3,4,5]; -- Monday to Friday (PostgreSQL: 0 = Sunday)

```

🧰 Backend Access Check (in Go)

```sql
func isWithinAllowedTime(user User) bool {
    now := time.Now()
    weekday := int(now.Weekday()) // Sunday = 0, Monday = 1
    hour := now.Hour()
    min := now.Minute()
    nowTime := fmt.Sprintf("%02d:%02d", hour, min)

    allowedToday := false
    for _, day := range user.AccessDays {
        if day == weekday {
            allowedToday = true
            break
        }
    }

    return allowedToday &&
        nowTime >= user.AccessStart.Format("15:04") &&
        nowTime <= user.AccessEnd.Format("15:04")
}

```

## 🌐 Passive Client-Side Ping Check

The frontend should **send a background request** every 15 minutes (or more often if needed) to ensure:

- The JWT is still valid
    
- The user is still within their allowed time window
    

### 🔁 Suggested Endpoint

```http
GET /api/auth/ping
Authorization: Bearer <jwt>

```

### 🔐 Backend Handler (Go)

```go

func AuthPingHandler(w http.ResponseWriter, r *http.Request) {
    user := getUserFromJWT(r) // Extract from claims or DB

    if !isWithinAllowedTime(user) {
        http.Error(w, "Access time window exceeded", http.StatusForbidden)
        return
    }

    w.WriteHeader(http.StatusOK)
}

```

### 🔁 Client Behavior

```js


setInterval(() => {
  fetch('/api/auth/ping', {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + localStorage.getItem('token')
    }
  }).then(res => {
    if (res.status === 403) {
      alert('Access window has ended. You have been logged out.');
      logout();
    }
  });
}, 15 * 60 * 1000); // 15 minutes
```

---

## 🔒 Why Not Store Access Time in JWT?

|Reason|Explanation|
|---|---|
|❌ JWTs are immutable|You’d need to re-issue JWT every time time changes|
|❌ User/org rules may change|You’d have stale data unless refreshed constantly|
|✅ Backend is authoritative|Always enforce live time-based rules on the server|

---

## ✅ Final Recommendations

- 🔐 Keep JWTs small and identity-focused
    
- ✅ Enforce time-based rules on backend (middleware or `/ping` route)
    
- ⚙️ Optionally cache access rules per user in Redis (TTL = 15 min)
    
- 🔄 Let frontend ping server every 15 minutes to detect session expiration or time window violations