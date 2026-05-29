# Project Updates

## 2026-05-29

- Added runtime distribution configuration for product name, company name, platform name, theme, and layout.
- Added frontend container startup generation of `/config.js` so white-label distribution values can change without rebuilding the image.
- Added three layout shells controlled by `HTX_LAYOUT`: `sidebar`, `topbar`, and `focus`.
- Added host binding and port startup parameters: `HTX_HOST_BIND`, `HTX_FRONTEND_PORT`, and `HTX_BACKEND_PORT`.
- Added mobile/tablet responsive behavior shared by all themes, including mobile bottom navigation and responsive fallbacks for grids, tabs, tables, and the annotation workbench.
- Renamed all public startup parameters to the `HTX_` prefix, including database, secret, upload, and SAM model settings.
- Added `scripts/download-ai-models.sh` for Ubuntu one-command YOLOv8n and SAM2 checkpoint downloads.
- Updated deployment docs, Obsidian vault notes, Docker Compose, `.env.example`, and deployment script for the new parameters.
