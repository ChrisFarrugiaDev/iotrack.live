# Key Inheritance and Override

## **Your Model: Key Inheritance and Override**

1. **Single top-level org (“App”)** starts with a key.
    
2. **Each org/sub-org** can:
    
    - Use the **parent org’s key** (inheritance).
        
    - Or **override with their own key**.
        
3. **Parent org can revoke its key** from a child org, forcing that child to set its own key or use the next available parent key.
    

---

### **Recommended Key Selection Logic**

- When a map/API request is made, **resolve the key** by checking:
    
    1. **Does this org have its own key?**
        
        - Yes → use it.
            
        - No → check parent org.
            
    2. **Continue up the tree** until you reach the root or find a key.
        
- If **no key found**, show a friendly error or fallback to a default (read-only, branding-only, etc).
    

---

### **Revoking a Key**

- If a parent revokes the key for a child:
    
    - That child (and its children, unless they have their own keys) must be prompted to set a new key, or map features are disabled.
        
    - You could have a flag like `can_inherit_key: true/false` for each org.
        

---

### **Sample Data Structure**

```json
{
  "org_id": "child123",
  "parent_org_id": "parent456",
  "maps_api_key": null,
  "can_inherit_key": true
}

```

- On every map request, traverse up the org tree:
    
    - If `can_inherit_key` is false, stop searching parent keys.
        
    - Otherwise, look for `maps_api_key` up the chain.
        

---

### **UI/UX Suggestions**

- In the admin/settings, clearly show:
    
    - “Using key from parent org: [ORG NAME]”
        
    - “Override key (optional): [Input box]”
        
    - “Warning: If parent revokes, you need to provide your own.”
        
- If key is revoked:
    
    - Show a warning/banner “Your access to maps has been revoked by your parent org. Please enter your own Google Maps API key to continue using map features.”
        

---

### **Code Logic (Pseudocode)**

```typescript
function resolveGoogleMapsKey(org) {
  let current = org;
  while (current) {
    if (current.maps_api_key && current.can_inherit_key !== false) {
      return current.maps_api_key;
    }
    if (current.can_inherit_key === false) break;
    current = current.parent_org; // look up the tree
  }
  throw new Error("No Google Maps API key available for this org or its parents.");
}

```

### **Summary Table**

|Scenario|Key Used|Fallback Behavior|
|---|---|---|
|Org has its own key|Own key|n/a|
|Org has no key, can inherit|Closest parent with key|n/a|
|Org has no key, inheritance revoked|None|Must enter key/show error|

---

## **Final Advice**

- Your model is scalable and supports both central control and per-org flexibility.
    
- Just make sure to **securely store keys** and **thoroughly test edge cases** (e.g. cascading revoke, missing keys).
    
- **Good documentation and UI feedback** will be important for org admins!
    

