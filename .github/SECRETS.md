# GitHub Secrets Configuration

This document lists all the secrets that need to be configured in GitHub repository settings for CI/CD pipelines to work properly.

## Required Secrets

### Docker Hub (for docker-build job)

- **DOCKER_USERNAME** - Your Docker Hub username
- **DOCKER_PASSWORD** - Your Docker Hub password or access token

### Code Coverage (optional)

- **CODECOV_TOKEN** - Codecov token for uploading coverage reports
  - Get from: https://codecov.io/

### Deployment Secrets

#### Staging Environment

- **STAGING_DATABASE_URL** - PostgreSQL connection string for staging
  - Format: `postgresql://user:password@host:port/database`

#### Production Environment

- **PRODUCTION_DATABASE_URL** - PostgreSQL connection string for production
  - Format: `postgresql://user:password@host:port/database`

### Notifications (optional)

- **SLACK_WEBHOOK_URL** - Slack webhook URL for deployment notifications
  - Create at: https://api.slack.com/messaging/webhooks

## How to Add Secrets

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with its corresponding value

## Environment-Specific Secrets

### Staging

Go to **Settings** → **Environments** → **staging** → **Add secret**

### Production

Go to **Settings** → **Environments** → **production** → **Add secret**

## Security Best Practices

1. **Never commit secrets to the repository**
2. **Rotate secrets regularly** (every 3-6 months)
3. **Use environment-specific secrets** for staging vs production
4. **Limit secret access** to specific workflows/environments
5. **Enable branch protection** for main and develop branches
6. **Require approval** for production deployments

## Additional Configuration

### Branch Protection Rules (Recommended)

For `main` branch:

- ✅ Require pull request reviews before merging
- ✅ Require status checks to pass before merging
  - lint
  - type-check
  - test
  - build
- ✅ Require branches to be up to date before merging
- ✅ Require conversation resolution before merging
- ✅ Do not allow bypassing the above settings

For `develop` branch:

- ✅ Require status checks to pass before merging
- ✅ Require branches to be up to date before merging

### Environment Protection Rules

For `production` environment:

- ✅ Required reviewers (at least 1)
- ✅ Wait timer: 5 minutes
- ✅ Deployment branches: Only `main` and tags matching `v*`

For `staging` environment:

- ✅ Deployment branches: Only `main` and `develop`

## Verifying Configuration

After adding secrets, you can verify they're working by:

1. Pushing to a feature branch
2. Creating a pull request to `develop` or `main`
3. Check that CI workflow runs successfully
4. For deployment, merge to `main` and verify deployment workflow

## Troubleshooting

If workflows fail due to missing secrets:

1. Check workflow logs for specific error messages
2. Verify secret names match exactly (case-sensitive)
3. Ensure secrets are set in the correct environment
4. Check that workflow has permission to access the secret

## Contact

For questions about secrets configuration, contact your DevOps team or repository administrator.
