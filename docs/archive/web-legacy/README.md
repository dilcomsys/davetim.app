# Legacy web archive

The former React/Vite web product was archived on 2026-08-03 when the project moved to mobile-first development.

## Code archive

- `archive/web-legacy/frontend`: former frontend source
- `archive/web-legacy/public`: former root public assets
- `archive/web-legacy/deployment/main.yml`: retired GitHub Pages/SSH deployment workflow
- `archive/web-legacy/docker-compose.yml`: retired web Docker composition
- `archive/web-legacy/dummy.ipynb`: empty notebook artifact retained for provenance

Generated `frontend/node_modules` and `frontend/dist` directories were removed before archiving. They are reproducible from the archived lockfile and source.

## Document archive

- `project-docs`: the former `docs` directory
- `root-reports`: implementation notes and completion reports previously stored at repository root
- `database-notes`: old template installation notes previously mixed with SQL files

## Warning

The archive is not an active build, deployment, payment, or database runbook. Its code previously had TypeScript, dependency, CI, and documentation inconsistencies. Treat it as historical reference only.
