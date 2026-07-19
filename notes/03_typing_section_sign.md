# TODO: set up typing the § (section sign) on Linux

The repo's docs and code comments use `§` to reference numbered sections of
the Activity Report design doc (e.g. `§17` = section 17). A US keyboard has
no § key — pick one of these:

1. **Compose key** (nicest, one-time setup): GNOME → Settings → Keyboard →
   Compose Key, pick e.g. Right Alt. Then `Compose` `s` `o` → §
2. **Unicode entry** (works in GTK apps, no setup): `Ctrl+Shift+U`, type
   `a7`, press Enter.
3. **Copy-paste** — fine for occasional use; grep for `§` in
   `computation.server.go/SPEC.md` and copy one.

When searching, the symbol is optional anyway: `grep -n "14.2" SPEC.md`
finds the section without typing §.
