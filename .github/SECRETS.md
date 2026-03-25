# GitHub Secrets Configuration

All secrets needed for CI/CD pipelines. Configure in **Settings → Secrets and variables → Actions**.

## Required Secrets

### VPS Deployment

| Secret        | Description                         | Example       |
| ------------- | ----------------------------------- | ------------- |
| `VPS_HOST`    | VPS IP address or hostname          | `203.0.113.1` |
| `VPS_USER`    | SSH username on VPS                 | `deploy`      |
| `VPS_PORT`    | SSH port                            | `22`          |
| `VPS_SSH_KEY` | Private SSH key for the deploy user | Full PEM key  |

### Container Registry (GHCR)

> [!NOTE]
> GHCR uses `GITHUB_TOKEN` automatically — no additional secrets needed for pushing images.

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret listed above

## VPS Setup Checklist

Before the deploy workflow can succeed, ensure the VPS has:

1. Docker and Docker Compose installed
2. The `deploy` user with docker group access
3. Project directory at `/opt/postly` with `.env` file (`chmod 600`)
4. GHCR login configured: `docker login ghcr.io -u <github-user> -p <PAT>`
5. SSH key added to `~/.ssh/authorized_keys` for the deploy user

## Branch Protection Rules (Recommended)

For `main` branch:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass (lint, type-check, test, build)
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

## Rollback

Every deploy tags images with the Git SHA. To rollback:

```bash
ssh deploy@<VPS_HOST>
cd /opt/postly
export API_IMAGE=ghcr.io/<repo>/api:<previous-sha>
export SCRAPER_IMAGE=ghcr.io/<repo>/scraper:<previous-sha>
export BOT_IMAGE=ghcr.io/<repo>/bot:<previous-sha>
docker compose -f docker-compose.prod.yml up -d --no-deps api bot scraper
```
