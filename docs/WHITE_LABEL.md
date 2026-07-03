# White Labelling

White labelling means letting each organisation customise how the app looks to their users — their own brand name, their own images — without changing the code. One installation of iotrack.live can look completely different to two different customers.

---

## What can be customised (minimum scope)

The login screen has three things we want to make configurable:

| What | Example default | What a customer might change it to |
|------|-----------------|------------------------------------|
| **App title** | "Welcome to IoTrack Live" | "Welcome to FleetView Pro" |
| **Background image** | Blurred map/paper texture | Customer's own cityscape photo |
| **Foreground image** | Hand holding phone | Customer's own product photo |

---

## How it works — the simple version

1. Each organisation can have its own white label settings stored in the database.
2. When the login page loads, the app fetches those settings from the server (before the user even logs in).
3. The login page then shows the customer's title and images instead of the defaults.
4. After login, the rest of the app also knows the title/brand name.

If an organisation has no custom settings, it falls back to the parent organisation's settings. If nobody up the chain has settings, the built-in defaults are used. This is the same inheritance pattern used for the Maps API key and AI API key.

---

## The "before login" problem

There is one important detail: the login screen needs the white label config **before the user has logged in**, so it cannot go through the normal access-profile endpoint (which requires authentication).

The solution is a small **public endpoint** — no login required — that returns the white label config for the current installation. The frontend calls this once when the app first loads, before showing the login screen.

```
GET /api/white-label/public
→ { app_title, login_bg_url, login_fg_url }
```

---

## Where data is stored

A new database table `app.white_label` holds one row per organisation that has custom branding:

```
app.white_label
├── id
├── organisation_id   (which org this belongs to)
├── app_title         (e.g. "FleetView Pro")
├── login_bg_url      (URL of the background image)
└── login_fg_url      (URL of the foreground/hero image)
```

It is a separate table (not extra columns on `organisations`) because white label config is logically separate and will grow over time (logo, colours, favicon, etc.).

---

## Images — how they get there

The project already has a running `file.server.go` microservice that handles image uploads. It accepts a file plus an `entity_type` and `entity_id`, processes the image (converts to JPEG, resizes if too large, strips metadata), saves it to disk, records it in the DB, and returns a URL. Serving images with caching headers is also already implemented.

For white label images the flow is:

1. Admin picks a file using a file picker in the White Labelling form
2. Frontend POSTs the file to `file.server.go` with `entity_type: "white_label"` and `entity_id: <org_id>`
3. File server returns a URL like `/img/white_label/3/abc-uuid.jpg`
4. Frontend stores that URL in the white label form field and saves it to the backend

**File upload is part of the MVP** — the infrastructure already exists in `file.server.go`. No new upload logic needs to be built.

---

## Everything that needs to change

### Database
- New table `app.white_label` in `initdb-scripts/05-tables.sql`

### Backend (`web.backend.node.ts`)
- New Prisma model for `white_label`
- New model class `WhiteLabel` with `getByOrgId()` — walks up the org tree if no config found
- New router `white-label.router.ts` with two routes:
  - `GET /api/white-label/public` — **no auth required** — used by the login screen
  - `GET /api/white-label` — authenticated — returns current org's config for the settings form
  - `PUT /api/white-label` — authenticated — saves changes (requires `org.update` permission)
- Access profile: also include white label in `settings` so authenticated pages know the title

### Frontend (`web.frontend.vue`)
- `settingsStore`: add `whiteLabel` state, getter, setter, and clear on logout
- `App.vue`: populate `whiteLabel` from access profile after login
- `main.ts` or `App.vue`: call the public endpoint **before** the login screen renders, store result
- `LoginView.vue`: replace hardcoded background image, foreground image, and title with reactive values from the store (fall back to defaults if null)
- **White Labelling view**: the menu item "White Labelling" already exists in the sidebar — wire it to a new form view with: App Title text input, Background Image file picker (uploads to `file.server.go`, fills URL automatically), Foreground Image file picker (same), and a Save button

---

## What the admin user sees

1. They click **White Labelling** in the sidebar menu.
2. A form appears with:
   - An **App Title** text input
   - A **Background Image** file picker — they choose a file, it uploads immediately and shows a preview
   - A **Foreground Image** file picker — same
3. They click Save.
4. Anyone who visits the login page for their organisation now sees the custom branding.

---

## Scope summary

| Area | Complexity |
|------|-----------|
| DB table | Low — one simple table |
| Backend model + inheritance | Low — same pattern as maps/ai key |
| Public endpoint (no auth) | Low — read-only, no auth middleware |
| Update endpoint | Low — same pattern as other update routes |
| Frontend store | Low — same pattern as mapsApiKey |
| Login screen wiring | Low — replace 3 hardcoded values with reactive ones |
| White Label settings form | Medium — new view with form, file pickers, preview, save |
| File upload (via `file.server.go`) | Low — infrastructure already exists, frontend just needs a file picker |

Total: mostly small, repeating familiar patterns. The new concept is the public (unauthenticated) endpoint for the login screen. File upload is already solved by the existing file server microservice.
