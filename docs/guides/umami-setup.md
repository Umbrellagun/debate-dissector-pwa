# Umami Self-Hosted Setup Guide

This guide explains how to set up Umami analytics for Debate Dissector.

## 1. Deploy Umami

Choose one of these options:

### Railway (Easiest)
- Go to [railway.app](https://railway.app)
- One-click deploy with included PostgreSQL database
- Follow the Umami template setup

### Render
- Go to [render.com](https://render.com)
- Deploy with managed database
- Use Umami's Blueprint for easy setup

### Docker
```bash
git clone https://github.com/umami-software/umami.git
cd umami
docker-compose up -d
```

### Vercel + External Database
- Deploy Umami to Vercel
- Use Supabase, Neon, or PlanetScale for PostgreSQL

## 2. Configure Umami

1. Access your Umami dashboard (e.g., `https://your-umami.railway.app`)
2. Create an account on first visit (default: admin/umami)
3. Go to **Settings → Websites → Add website**
4. Enter:
   - **Name**: Debate Dissector
   - **Domain**: `debate-dissector.vercel.app` (your actual domain)
5. Copy the **Website ID** (UUID format like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

## 3. Set Environment Variables

In your Vercel project settings, add these environment variables:

```
REACT_APP_UMAMI_SCRIPT_URL=https://your-umami-instance.com/script.js
REACT_APP_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Or update your local `.env` file for development:

```env
REACT_APP_UMAMI_SCRIPT_URL=https://your-umami-instance.com/script.js
REACT_APP_UMAMI_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

## 4. Redeploy

After setting environment variables, redeploy the app to activate tracking.

## 5. View Analytics

Access your Umami dashboard to see:
- **Page views** - Automatic tracking of all pages
- **Custom events** - Document creation, PWA installs, etc.
- **Visitor stats** - Unique visitors, sessions, bounce rate
- **Device info** - Browser, OS, screen size (privacy-friendly)

## Events Tracked

The app tracks these custom events via `useAnalytics` hook:

| Event | Description |
|-------|-------------|
| `pwa_installed` | User installed the PWA |
| `pwa_prompt_shown` | Install prompt was displayed |
| `pwa_prompt_dismissed` | User dismissed install prompt |
| `document_created` | New document created |
| `document_deleted` | Document deleted |

## Privacy

Umami is GDPR-compliant and privacy-friendly:
- No cookies required
- No personal data collected
- All data owned by you
- No data sharing with third parties
