# Bundled PDF Export Binaries

Build-time provisioning (`bun run prepare:pdf-tools`) places platform-specific binaries in:

- `src-tauri/resources/bin/macos/pandoc`
- `src-tauri/resources/bin/macos/tectonic`
- `src-tauri/resources/bin/linux/pandoc`
- `src-tauri/resources/bin/linux/tectonic`
- `src-tauri/resources/bin/windows/pandoc.exe`
- `src-tauri/resources/bin/windows/tectonic.exe`

These binaries are generated for packaging and typically not committed because of size and
license-management concerns.
