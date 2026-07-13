# Deployment Session Context

## Current Goal

Deploy `desperate.io` as an MVP using the deployment direction from `docs/deployment-summary.md`:

- Frontend on Vercel.
- Backend on AWS EC2 `t3.micro` in Mumbai region `ap-south-1`.
- PostgreSQL on the same EC2 instance initially.
- Docker Compose for backend and database.
- HTTPS in front of the backend using Caddy or Nginx.
- Temporary backend hostname can use `<EC2_PUBLIC_IP>.sslip.io` until a real domain is available.

## Repository Context Read

The following files were read for context:

- `AGENTS.md`
- `.ai/project-context.md`
- `docs/deployment-summary.md`

Important repo constraints:

- Do not commit secrets, real environment values, SSH keys, AWS keys, JWT secrets, database passwords, or OpenAI keys.
- Do not push directly to `main` or `master`.
- Keep changes focused and reviewable.
- Preserve the modular monolith architecture.
- Deployment work should not change API contracts unless explicitly required.

## Deployment Decisions Made

- Configure AWS/backend before Vercel because Vercel needs a stable backend HTTPS URL for `NEXT_PUBLIC_API_BASE_URL`.
- Vercel project can be created early, but frontend deployment is not final until the backend HTTPS URL exists.
- For AWS account access, use a normal IAM user instead of IAM Identity Center for now.
- Reason: user is concerned that enabling IAM Identity Center / AWS Organizations could affect student or free credits.
- Use root account only for account-level tasks.
- Root MFA should be enabled and treated as mandatory.
- A non-root IAM admin user has been created.
- Recommended IAM structure used:
  - IAM user: `afnan-admin`
  - IAM group: `admins`
  - Managed policy attached to group: `AdministratorAccess`

## Local Machine Checks Completed

Git, Node, and npm are installed:

```text
git version 2.43.0.windows.1
node v20.13.1
npm 10.5.2
```

This satisfies the project expectation of Node.js 20.

SSH is installed:

```text
OpenSSH_for_Windows_9.5p2, LibreSSL 3.8.2
```

This machine can run SSH commands. Actual EC2 SSH access still depends on:

- EC2 public IP or hostname.
- Correct `.pem` key path.
- Security group allowing port `22` from the current public IP.

Docker is installed but not fully usable yet:

```text
Docker version 26.0.0, build 2ae903e
```

The following commands failed:

```powershell
docker compose version
docker info --format '{{.ServerVersion}}'
```

Failure:

```text
WARNING: unable to read config file: open C:\Users\afnan\.docker\config.json: Access is denied.
C:\Users\afnan\.docker\config.json: open C:\Users\afnan\.docker\config.json: Access is denied.
```

Docker next action:

- Fix permissions for `C:\Users\afnan\.docker\config.json`, or recreate that Docker config file.
- Then verify:

```powershell
docker compose version
docker info
```

## AWS CLI Setup Status

AWS account setup guidance given:

1. Create AWS account.
2. Enable MFA on root account.
3. Create a non-root IAM user.
4. Put the user in an `admins` group.
5. Attach `AdministratorAccess` to the group for initial MVP deployment.
6. Create CLI access keys for the IAM user.
7. Configure local AWS CLI with:

```powershell
aws configure
```

Use:

```text
Default region name: ap-south-1
Default output format: json
```

Verify with:

```powershell
aws sts get-caller-identity
```

Current status:

- IAM user has been created.
- Root account MFA is enabled.
- IAM user MFA is enabled.
- AWS Budget has been created for the account.
- CLI access keys were created for local AWS CLI setup.
- AWS CLI v2 was installed and configured locally.

AWS CLI was later configured and verified:

```text
Account: 533267140137
IAM user: arn:aws:iam::533267140137:user/afnan-admin
Region: ap-south-1
```

## EC2 Status

EC2 instance has been launched:

```text
Instance ID: i-00ef90baf460dd324
Public IP: 13.206.94.11
Public DNS: ec2-13-206-94-11.ap-south-1.compute.amazonaws.com
Type: t3.micro
Key pair: desperate-mvp-key
OS: Ubuntu 24.04 LTS
```

SSH key was moved locally to:

```text
C:\Users\afnan\.ssh\desperate-mvp-key.pem
```

SSH was verified successfully as user `ubuntu`.

EC2 bootstrap completed:

- System packages updated.
- Git, curl, ca-certificates, and basic tooling installed.
- Docker Engine installed.
- Docker Compose plugin installed.
- Docker service enabled and started.
- `ubuntu` user added to the `docker` group.
- 2 GB swap file created and enabled at `/swapfile`.
- Public repo cloned to `/home/ubuntu/desperate.io`.

Verified server versions:

```text
Docker version 29.6.1
Docker Compose version v5.3.1
Swap: 2.0Gi
Repo branch: master
Repo commit: a3bea7a
```

The backend containers have not been started for final production yet because deployment compatibility changes still need to land.

## Deployment Compatibility Work Still Needed

Before final Vercel/browser auth testing:

- Update production auth cookie behavior for split frontend/backend domains:
  - Use `SameSite=None` in production, preferably configurable through `COOKIE_SAME_SITE`.
  - Keep `HttpOnly`, `Secure`, and `path=/`.
  - Clear logout cookie using matching production cookie options.
- Ensure backend CORS allows the Vercel frontend domain and credentials.
- Create safe production env example/documentation.
- Use `docker-compose.prod.yaml` for production:
  - Backend is published on `127.0.0.1:${BACKEND_PORT}:4000` for a local reverse proxy.
  - Postgres is not published to the public network.
- Copy `.env.production.example` to `.env` on EC2.
- Copy `backend/.env.production.example` to `backend/.env` on EC2.
- Use production env values only on EC2:
  - `NODE_ENV=production`
  - `DB_SYNC=false`
  - strong `JWT_SECRET`
  - real `OPENAI_API_KEY`
  - `CORS_ORIGIN=https://<vercel-domain>`
  - `COOKIE_SAME_SITE=none`

Production container start command:

```bash
docker compose -f docker-compose.prod.yaml up -d --build
```

## Recommended Next Steps

1. Finish AWS CLI setup on this machine:

   ```powershell
   aws --version
   aws configure
   aws sts get-caller-identity
   ```

2. Fix Docker config permissions and verify Docker Compose:

   ```powershell
   docker compose version
   docker info
   ```

3. Create EC2 instance:

   - Region: `ap-south-1`
   - Type: `t3.micro`
   - OS: Ubuntu LTS
   - Storage: 20-30 GB gp3
   - Security group:
     - SSH `22` from user's IP only
     - HTTP `80` public
     - HTTPS `443` public
     - No public PostgreSQL `5432`

4. Download and store EC2 `.pem` key securely outside the repo.

5. Bootstrap EC2:

   - Install Docker and Docker Compose plugin.
   - Add 2 GB swap.
   - Clone repo.
   - Create production `.env` files on server only.
   - Start backend and PostgreSQL with Docker Compose.
   - Verify `/health`.

6. Add HTTPS reverse proxy:

   - Prefer Caddy for simpler automatic HTTPS.
   - Use `<EC2_PUBLIC_IP>.sslip.io` for first deployment.

7. Configure Vercel after backend HTTPS URL exists:

   - Project root: `frontend`
   - `NEXT_PUBLIC_API_BASE_URL=https://<backend-hostname>`
   - Deploy production frontend.

## Security Notes

- Never commit AWS access keys, `.pem` files, `.env` files, JWT secrets, database passwords, or OpenAI keys.
- Root account should not be used for everyday work.
- Restrict SSH to the user's public IP.
- Do not expose PostgreSQL publicly.
- Production backend cookies must be `HttpOnly`, `Secure`, and likely `SameSite=None` for Vercel-to-AWS cross-site auth.
- Backend must use HTTPS before browser cookie auth can work reliably in production.
