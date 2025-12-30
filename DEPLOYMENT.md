# Deployment Guide

## 1. Supabase Setup
1. Go to [Supabase](https://supabase.com) and create a new project.
2. Go to the **SQL Editor** in the left sidebar.
3. Copy the contents of the `schema.sql` file in this repository and run it.
4. Go to **Project Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key (Keep this safe!)

## 2. GitHub Actions (Backend)
1. Push this code to potential GitHub repository.
2. Go to your Repository **Settings > Secrets and variables > Actions**.
3. Add the following Repository Secrets:
   - `SUPABASE_URL`: Your Supabase Project URL.
   - `SUPABASE_KEY`: Your **service_role** key (needed to insert data).
4. The scraper will now run automatically every day at 12:00 AM IST.

## 3. Vercel Deployment (Frontend)
1. Go to [Vercel](https://vercel.com) and "Add New > Project".
2. Import your GitHub repository.
3. In the "Configure Project" step:
   - **Root Directory**: Click "Edit" and select `frontend`.
   - **Environment Variables**: Add the following:
     - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your **anon** public key.
4. Click **Deploy**.

## 4. Domain Setup (orravyn.info)
1. In your Vercel Project Dashboard, go to **Settings > Domains**.
2. Add `orravyn.info`.
3. Vercel will provide you with DNS records (usually an **A Record** `76.76.21.21` or a **CNAME** `cname.vercel-dns.com`).
4. Go to your **Cloudflare Dashboard**:
   - Select your domain `orravyn.info`.
   - Go to **DNS**.
   - Add the records provided by Vercel.
   - Ensure the Proxy status (orange cloud) is **Proxied** for standard Cloudflare benefits, or **DNS Only** if Vercel has issues verifying SSL (usually Proxied is fine if SSL mode is Full).
5. Go to **SSL/TLS** in Cloudflare and ensure mode is set to **Full (Strict)**.

## Local Development
To run the frontend locally:
1. Create `frontend/.env.local` with your Supabase credentials.
2. Run:
   ```bash
   cd frontend
   npm run dev
   ```
