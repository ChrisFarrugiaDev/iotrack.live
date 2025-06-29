# Organization Hierarchy & Access Control Design



This document outlines how to implement and query a hierarchical organization structure with asset/user relationships similar to ThingsBoard, using PostgreSQL and best practices.

---

## 🧱 Database Tables

### 1. **Organizations** (self-referencing hierarchy)

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id UUID REFERENCES organizations(id) ON DELETE SET NULL
);
```

- Each organization can have a `parent_id`.
    
- Root organizations have `parent_id = NULL`.
    

### 2. **Users**

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id)
);
```

- Each user belongs to an organization.
    

### 3. **Assets**

```sql
CREATE TABLE assets (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id)
);
```

- Assets are assigned to organizations.
    

### 4. **User Asset Exclusions** (optional restriction)

```sql
CREATE TABLE user_asset_exclusions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, asset_id)
);
```

- Allows overriding default org-based access by excluding assets per user.
    

---

## 🔍 Recursive Query: Org Tree

```sql
WITH RECURSIVE org_tree AS (
    SELECT id FROM organizations WHERE id = :user_org_id
    UNION ALL
    SELECT o.id FROM organizations o
    INNER JOIN org_tree ot ON o.parent_id = ot.id
)
SELECT * FROM org_tree;
```

- Fetches the user's org and all sub-orgs (child, grandchild, etc.)
    

---

## 🔐 Final Query: Fetch Visible Assets for User

```sql
WITH RECURSIVE org_tree AS (
    SELECT id FROM organizations WHERE id = :user_org_id
    UNION ALL
    SELECT o.id FROM organizations o
    INNER JOIN org_tree ot ON o.parent_id = ot.id
)
SELECT a.*
FROM assets a
JOIN org_tree ot ON a.organization_id = ot.id
WHERE a.id NOT IN (
    SELECT asset_id FROM user_asset_exclusions WHERE user_id = :user_id
);
```

- Gets all assets in the user's org + sub-orgs, excluding any individually restricted.
    

---

## ✅ Notes

- Index `organization_id` in `assets` and `users` tables.
    
- Optionally support a whitelist model instead of exclusions for limited user roles.
    
- Use CTEs for recursive queries when resolving hierarchy at runtime.
    
- Cache results in Redis for performance if needed.
    

---

## 📌 Optional Enhancements

- Add `role` to users for fine-grained permissions.
    
- Add `access_start`, `access_end`, and `access_days` to `users` for time-restricted logins.
    
- Add audit logs for asset visibility changes.
    

---

> Designed for scalable access control in multi-tenant IoT platforms or enterprise apps.