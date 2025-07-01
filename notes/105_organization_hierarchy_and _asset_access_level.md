Each org should have a `parent_org_id` (nullable, for the root org) in your database. This creates a **parent-child hierarchy**, which makes it easy to:

- Traverse “up” the org tree to resolve inherited values (like the API key)
    
- Support unlimited levels of nested orgs
    
- Easily add, remove, or move orgs within the tree
    

---

## **Sample Table Structure**

Here’s a basic example for a PostgreSQL (or MySQL) table:
```sql
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_org_id INTEGER REFERENCES organizations(id) ON DELETE SET NULL,
    maps_api_key VARCHAR(255),          -- Nullable, can be null if using parent's
    can_inherit_key BOOLEAN DEFAULT TRUE -- If false, must provide own key
);

```

- `parent_org_id` refers back to the same table (`organizations`)
    
- If `parent_org_id` is `NULL`, the org is at the top of the hierarchy (root org/app owner)
    
- For each org, you can “walk up” the tree via `parent_org_id` to find inherited data
    

---

## **Example Data**

|id|name|parent_org_id|maps_api_key|can_inherit_key|
|---|---|---|---|---|
|1|App Root|NULL|KEY_APPROOT|TRUE|
|2|Client A|1|NULL|TRUE|
|3|Client B|1|KEY_CLIENT_B|TRUE|
|4|Branch 1|2|NULL|TRUE|
|5|Branch 2|2|KEY_BRANCH_2|TRUE|

- “Branch 1” will use the key from “App Root” (since neither it nor “Client A” has a key).
    
- “Branch 2” will use its own key.
    

---

## **How to Query the Tree**

You can use a recursive query (CTE) to walk up the tree in SQL, or handle it in your application logic.

**Example (pseudo-SQL):**

```sql
-- Find the first available key going up the tree
WITH RECURSIVE org_tree AS (
    SELECT id, parent_org_id, maps_api_key
    FROM organizations
    WHERE id = :org_id
    UNION ALL
    SELECT o.id, o.parent_org_id, o.maps_api_key
    FROM organizations o
    INNER JOIN org_tree ot ON o.id = ot.parent_org_id
)
SELECT maps_api_key FROM org_tree WHERE maps_api_key IS NOT NULL LIMIT 1;

```

## **Summary**

- **Yes, each org should have a `parent_org_id` field!**
    
- This is the standard and scalable way to do nested orgs and inheritance in any system.
    

Let me know if you want example queries, sample migration scripts, or a JSON schema for API calls!


```sql
WITH RECURSIVE org_chain AS (
    SELECT
        uuid,
        name,
        parent_org_uuid
    FROM app.organizations
    WHERE uuid = :start_uuid  -- <-- replace with your org's uuid
    UNION ALL
    SELECT
        o.uuid,
        o.name,
        o.parent_org_uuid
    FROM app.organizations o
    INNER JOIN org_chain oc ON o.uuid = oc.parent_org_uuid
    WHERE o.uuid != o.parent_org_uuid  -- stop recursion at root
)
SELECT * FROM org_chain;
How It Works:
Start with any org (replace :start_uuid).
```

Follows the parent chain until reaching the root org (where uuid = parent_org_uuid).

Lists the full ancestry up to the root.