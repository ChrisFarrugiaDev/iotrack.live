# User-Asset Visibility

## ✅ **Recommendation: Use a Relation Table (Many-to-Many)**

> 📌 **Do NOT store asset IDs as an array or JSON in the `users` table**  
> ✅ Instead, use a clean **junction table** like


## ✅ **Best Practice (Based on Org Hierarchy):**

> 🎯 **Use an exclusion table** (`user_asset_exclusions`) if users inherit access from their organization and its sub-orgs by default.

---

## 🔍 Why Exclusion-Based Access Is Better in Your Case

|Reason|Explanation|
|---|---|
|✅ **Org-based access is the default**|Users already inherit assets from their org and children via the recursive query — no need to list every asset|
|✅ **Simplifies permission logic**|Just check: _“Is this asset excluded?”_ — if not, it's visible|
|✅ **Scales better**|You don't have to store thousands of asset entries for every user|
|✅ **Fits real-world structure**|Admins may want to “hide just this asset” from a user, not whitelist every visible one|
|✅ **Simpler auditing**|You only log exceptions, not full permissions for every user|

---

## 🚫 Problems with Using a Whitelist (explicitly allowed assets)

|Problem|Why It’s an Issue|
|---|---|
|❌ High maintenance|You’d have to insert every accessible asset ID for every user|
|❌ Fragile with org changes|If the user’s org is updated, all whitelist data must be rebuilt|
|❌ Slower queries|Especially for users with many assets|
|❌ No inheritance|Requires replicating org hierarchy logic manually|

## ✅ Recommended Design

```sql
CREATE TABLE user_asset_exclusions (     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,     asset_id UUID REFERENCES tracking.assets(id) ON DELETE CASCADE,     PRIMARY KEY (user_id, asset_id) );
```

### Example Logic:

```sql

-- Get all assets user can see (org-inherited minus exclusions)
WITH RECURSIVE org_tree AS (
    SELECT id FROM organizations WHERE id = :user_org_id
    UNION ALL
    SELECT o.id FROM organizations o
    JOIN org_tree ot ON o.parent_id = ot.id
)
SELECT a.*
FROM tracking.assets a
JOIN org_tree ot ON a.organization_id = ot.id
WHERE NOT EXISTS (
    SELECT 1 FROM auth.user_asset_exclusions e
    WHERE e.user_id = :user_id AND e.asset_id = a.id
);

```
```