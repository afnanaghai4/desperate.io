# Deployment Summary

## Recommendation

Use a split deployment for the MVP:

- Frontend: Vercel Hobby/free plan
- Backend: AWS EC2 `t3.micro` in Mumbai region `ap-south-1`
- Database: PostgreSQL on the same EC2 instance initially
- Proxy and HTTPS: Nginx with Let's Encrypt, or Caddy for simpler automatic HTTPS
- Deployment style: Docker Compose for backend and PostgreSQL

This is a practical low-cost setup while using AWS student/free credits. Moving the frontend to Vercel keeps the EC2 instance focused on the NestJS backend and PostgreSQL, which makes `t3.micro` more realistic for early usage.

## Cost Considerations

- EC2 `t3.micro` is suitable for an MVP, but it is still constrained by 1 GB RAM.
- AWS public IPv4 currently adds roughly `$3.60/month` at `$0.005/hour`.
- EBS storage adds a small monthly cost depending on disk size.
- Vercel Hobby can host the frontend for free for personal/small usage.
- OpenAI API usage is separate from hosting and should be monitored.
- Avoid RDS, ECS, Load Balancer, NAT Gateway, and Kubernetes for the first deployment because they add cost and operational complexity before the app needs them.

## Technical Considerations

- Add swap memory on the EC2 instance to reduce crash risk on a 1 GB machine.
- Keep PostgreSQL memory settings conservative while it runs on the same instance as the backend.
- Use HTTPS for the backend before connecting it to the Vercel frontend.
- Configure backend CORS to allow the Vercel frontend domain.
- Enable credentialed CORS because the frontend sends authenticated requests with cookies.
- Configure production auth cookies with `Secure`; cross-site frontend/backend domains may require `SameSite=None`.
- Set Vercel `NEXT_PUBLIC_API_BASE_URL` to the backend API domain.

## Upgrade Path

Start with the cheapest practical deployment:

1. Vercel frontend plus EC2 `t3.micro` backend and PostgreSQL.
2. Upgrade EC2 to `t3.small` if memory, deploy stability, or traffic becomes an issue.
3. Move PostgreSQL to RDS, Neon, or Supabase when real user data and backup/reliability needs justify the added cost.
4. Add managed AWS services only after traffic or reliability requirements make them necessary.

## Current Decision

Proceed with frontend on Vercel and backend plus PostgreSQL on AWS EC2 `t3.micro` in Mumbai for the first deployment. This keeps cost low, uses the available AWS student/free credits, and is enough for an MVP or early demo.

# PLAN

## Summary

Deploy the app as:

- Frontend: Vercel, auto-deployed from GitHub.
- Backend: AWS EC2 `t3.micro` in Mumbai `ap-south-1`.
- Database: PostgreSQL on the same EC2 instance for MVP.
- CD: GitHub Actions deploys backend to EC2 after CI passes on `master`.
- HTTPS: Use a temporary DNS hostname first, then move to a real domain/subdomain when ready.

Because there is no owned domain yet, use a temporary hostname like `<EC2_PUBLIC_IP>.sslip.io` for the first test deployment. Before sharing with real users, buy a domain and point `api.<domain>` to EC2.

## Code And Env Changes Needed

### Backend Auth/CORS

- Update production cookie config in `backend/src/auth/auth.controller.ts`:
  - Current production `sameSite: 'strict'` will break Vercel-to-AWS cookie auth.
  - Use `sameSite: process.env.COOKIE_SAME_SITE ?? 'none'` in production.
  - Keep `httpOnly: true`, `secure: true`, `path: '/'`.
  - Clear logout cookie with matching production cookie options.
- Keep backend CORS credentialed:
  - `CORS_ORIGIN=https://<your-vercel-app>.vercel.app`
  - Later change to `https://<your-frontend-domain>` if using custom frontend domain.
- Keep `credentials: 'include'` in frontend `apiFetch`; it is already correct.

### Production Environment Files

- Add a safe example file such as `backend/.env.production.example`.
- Required backend production env:
  - `NODE_ENV=production`
  - `PORT=4000`
  - `DB_HOST=postgres`
  - `DB_PORT=5432`
  - `DB_USERNAME=<prod_user>`
  - `DB_PASSWORD=<strong_password>`
  - `DB_NAME=desperate_db`
  - `DB_SYNC=false`
  - `JWT_SECRET=<long_random_secret>`
  - `JWT_EXPIRES_IN=1d`
  - `OPENAI_API_KEY=<real_key_on_server_only>`
  - `OPENAI_MODEL=<chosen_model>`
  - `CORS_ORIGIN=https://<vercel-domain>`
  - `COOKIE_SAME_SITE=none`
- In Vercel, set:
  - `NEXT_PUBLIC_API_BASE_URL=https://<backend-hostname>`

### Docker/Server Deployment

- Keep backend and Postgres on Docker Compose.
- Add or document a production compose flow that:
  - Builds backend from repo.
  - Runs Postgres with a named volume.
  - Does not expose Postgres publicly.
  - Exposes backend only internally to Nginx/Caddy, or on localhost.
- Add Caddy or Nginx config for:
  - HTTPS termination.
  - Reverse proxy from `https://<backend-hostname>` to backend `localhost:4000`.
  - `/health` reachable publicly.

## Security Considerations

- Do not commit `.env`, OpenAI keys, JWT secrets, SSH keys, or database passwords.
- Use a long random `JWT_SECRET`, generated locally with a secure command.
- EC2 security group:
  - Allow `22` SSH only from your IP.
  - Allow `80` and `443` from anywhere.
  - Do not allow public `5432`.
  - Do not expose backend port `4000` publicly if using reverse proxy.
- AWS account:
  - Enable MFA on root account.
  - Create an IAM admin/user for daily work; do not use root access keys.
  - Set AWS Budget alerts.
  - Keep student/free-credit usage monitored.
- EC2:
  - Use Ubuntu LTS.
  - Install security updates.
  - Add swap because `t3.micro` has only 1 GB RAM.
  - Use SSH key auth only.
  - Keep Docker volumes backed up.
- Database:
  - Start with same-instance Postgres for cost.
  - Add scheduled `pg_dump` backups to a local backup folder first.
  - Later move backups to S3 or move DB to managed Postgres.
- OpenAI:
  - Store API key only in EC2 `.env`.
  - Monitor OpenAI spend separately from AWS.
- Cookies:
  - Production cookies must be `HttpOnly`, `Secure`, and `SameSite=None` for Vercel + AWS split-domain auth.
  - Backend must be HTTPS or browser cookies will not work.

## Local Machine Setup

### AWS CLI On Windows

1. Install AWS CLI v2 from AWS's Windows installer.
2. Verify:

   ```powershell
   aws --version
   ```

3. Create AWS account and enable MFA.
4. In AWS IAM Identity Center or IAM, create credentials for CLI access.
5. Configure CLI:

   ```powershell
   aws configure
   ```

6. Use:
   - Region: `ap-south-1`
   - Output: `json`
7. Verify identity:

   ```powershell
   aws sts get-caller-identity
   ```

### Vercel CLI On Windows

1. Install Vercel CLI:

   ```powershell
   npm install -g vercel
   ```

2. Login:

   ```powershell
   vercel login
   ```

3. From `frontend/`, link project:

   ```powershell
   vercel link
   ```

4. Set production env in Vercel dashboard or CLI:

   ```powershell
   vercel env add NEXT_PUBLIC_API_BASE_URL production
   ```

5. Deploy once manually for validation:

   ```powershell
   vercel --prod
   ```

6. Then connect the GitHub repo in Vercel so future frontend deploys happen automatically on push/merge.

## Deployment Steps

### 1. Prepare GitHub

- Work on a feature branch, not directly on `master`.
- Add code/env/deployment config changes.
- Open PR.
- CI must pass before merge.
- Backend CD should trigger only on push to `master`, after CI jobs pass.

### 2. Create AWS EC2 Instance

- Region: Mumbai `ap-south-1`.
- Instance: `t3.micro`.
- OS: Ubuntu LTS.
- Storage: start with 20-30 GB gp3 EBS.
- Security group:
  - SSH `22`: your IP only.
  - HTTP `80`: public.
  - HTTPS `443`: public.
  - No public PostgreSQL.
- Create/download SSH key pair.

### 3. Bootstrap EC2 Manually Once

SSH into server:

```bash
ssh -i <key.pem> ubuntu@<ec2-public-ip>
```

Install basics:

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y git docker.io docker-compose-plugin
sudo usermod -aG docker ubuntu
```

Add swap:

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

Make swap persistent:

```bash
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Clone repo:

```bash
git clone https://github.com/afnanaghai4/desperate.io.git ~/desperate.io
cd ~/desperate.io
```

Create production env files on server only:

```bash
nano backend/.env
nano .env
```

Start backend/Postgres:

```bash
docker compose up -d --build backend
```

Verify:

```bash
docker compose ps
curl http://localhost:4000/health
```

### 4. Configure HTTPS

For first test without owned domain:

- Point backend URL to `https://<EC2_PUBLIC_IP>.sslip.io`.
- Configure Caddy or Nginx to reverse proxy that hostname to `localhost:4000`.
- Use Caddy if possible because HTTPS setup is simpler.

Later with real domain:

- Buy a domain.
- Add DNS `A` record:
  - `api.<domain>` -> EC2 public IPv4.
- Update backend hostname, Vercel env, and backend `CORS_ORIGIN`.

### 5. Configure Vercel Frontend

- Import GitHub repo in Vercel.
- Set project root to `frontend`.
- Build command: `npm run build`.
- Install command: `npm ci`.
- Output handled by Next.js/Vercel.
- Set:
  - `NEXT_PUBLIC_API_BASE_URL=https://<backend-hostname>`
- Deploy.
- Test signup/login/profile/job flows from Vercel URL.

### 6. Add GitHub Actions CD

- Add backend deploy workflow triggered on push to `master`.
- Workflow should:
  - Wait for or depend on existing CI success.
  - SSH into EC2.
  - `cd ~/desperate.io`
  - `git fetch && git reset --hard origin/master`
  - `docker compose up -d --build backend`
  - `docker image prune -f`
  - Run `curl http://localhost:4000/health` on the server.
- Add GitHub repository secrets:
  - `EC2_HOST`
  - `EC2_USER=ubuntu`
  - `EC2_SSH_KEY`
  - `EC2_APP_DIR=/home/ubuntu/desperate.io`
- Do not put production `.env` values in GitHub unless moving to a deliberate secrets-management workflow.

## Test Plan

Before merging deployment changes:

- Backend:
  - `npm run lint`
  - `npm run test:cov -- --runInBand`
  - `npm run test:e2e -- --runInBand`
  - `npm run build`
- Frontend:
  - `npm run lint`
  - `npm run type-check`
  - `npm run test`
  - `npm run build`

After deployment:

- `GET https://<backend-hostname>/health` returns healthy response.
- Vercel frontend loads.
- Signup sets an HTTP-only secure cookie.
- Login persists session after page refresh.
- Protected routes work from Vercel.
- Create job works.
- Analyze job works without exposing OpenAI key.
- Logout clears cookie.
- PostgreSQL is not reachable publicly.
- Direct HTTP redirects to HTTPS.

## Assumptions

- First deployment is MVP/learning deployment, not high-availability production.
- PostgreSQL stays on the EC2 instance initially to minimize cost.
- Temporary `sslip.io` hostname is acceptable until you buy a domain.
- Backend CD uses GitHub Actions over SSH after merge to `master`.
- Frontend uses Vercel's GitHub integration for automatic deploys.
- No AWS RDS, ECS, Load Balancer, NAT Gateway, or Kubernetes for this first version.
