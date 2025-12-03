---
description: How to deploy the app to Vercel
---

# Deploying to Vercel

1.  **Import Project**:
    *   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    *   Click **Add New...** > **Project**.
    *   Select **Import** next to your `news-pulse` repository.

2.  **Configure Environment Variables**:
    *   In the "Environment Variables" section, add:
        *   `GOOGLE_API_KEY`: (Your Gemini API Key)
        *   `GOOGLE_SEARCH_CX`: (Your Search Engine ID)
    *   *Note: Do not add DATABASE_URL yet, the database setup will do it.*

3.  **Deploy**:
    *   Click **Deploy**.
    *   *The build might fail or the app might error initially because the database isn't connected yet. This is normal.*

4.  **Set up Database (Vercel Postgres)**:
    *   Once the project is created, go to the **Storage** tab in your Vercel project dashboard.
    *   Click **Create Database** > **Postgres**.
    *   Give it a name (e.g., `news-pulse-db`) and region.
    *   Click **Create**.
    *   **Important**: In the "Quickstart" or ".env.local" tab of the database page, find the `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` values.
    *   Vercel automatically adds these to your project's Environment Variables, so a redeploy will fix the connection.

5.  **Sync Database Schema**:
    *   You need to push your Prisma schema to this new cloud database.
    *   Copy the `POSTGRES_PRISMA_URL` and `POSTGRES_URL_NON_POOLING` values.
    *   Paste them into your **local** `.env` file (replacing the old values).
    *   Run this command in your local terminal:
        ```bash
        npx prisma db push
        ```
    *   This creates the tables (User, Newsletter, etc.) in your Vercel database.

6.  **Finalize**:
    *   Go back to Vercel and **Redeploy** (if the first deploy failed) or just visit your app URL.
    *   The Cron job for daily newsletters is now active!
