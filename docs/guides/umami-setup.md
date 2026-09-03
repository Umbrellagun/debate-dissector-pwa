# Umami Analytics Setup Guide

This guide explains how to set up Umami analytics for Debate Dissector.

## Recommended: Umami Cloud (Free Hobby Tier)

The easiest option — nothing to host or maintain. The free **Hobby** tier covers
~10K events/month and 3 websites, which is plenty for Debate Dissector.

1. Sign up at [cloud.umami.is](https://cloud.umami.is)
2. Add your website: **Settings → Websites → Add website**
   - **Name**: Debate Dissector
   - **Domain**: your deployed domain (e.g. `debate-dissector.vercel.app`)
3. Copy the **Website ID** (UUID format like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
4. Set these environment variables in Vercel (**Settings → Environment Variables**)
   or your local `.env`:

```env
REACT_APP_UMAMI_SCRIPT_URL=https://cloud.umami.is/script.js
REACT_APP_UMAMI_WEBSITE_ID=your-website-id
```

5. Redeploy. Tracking activates once **both** variables are set. The app loads the
   script automatically (see `src/index.tsx`) and custom events flow through the
   `useAnalytics` hook — no code changes needed.

View your stats anytime at [cloud.umami.is](https://cloud.umami.is).

---

## Alternative: Self-Hosting

Only needed if you want full data ownership or higher free limits. Otherwise skip
this section.

### 1. Deploy Umami

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

### 2. Configure Umami

1. Access your Umami dashboard (e.g., `https://your-umami.railway.app`)
2. Create an account on first visit (default: admin/umami)
3. Go to **Settings → Websites → Add website**
4. Enter:
   - **Name**: Debate Dissector
   - **Domain**: `debate-dissector.vercel.app` (your actual domain)
5. Copy the **Website ID** (UUID format like `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)

### 3. Set Environment Variables

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

### 4. Redeploy

After setting environment variables, redeploy the app to activate tracking.

## Viewing Analytics

Log in to your Umami dashboard — [cloud.umami.is](https://cloud.umami.is) for
Umami Cloud, or your own instance URL if self-hosting — to see:
- **Page views** - Automatic tracking of all pages
- **Custom events** - Document creation, PWA installs, etc.
- **Visitor stats** - Unique visitors, sessions, bounce rate
- **Device info** - Browser, OS, screen size (privacy-friendly)

## Events Tracked

Page views are tracked automatically by Umami. On top of that, the app sends the
custom events below via the `useAnalytics` hook. The source of truth for this list
is `src/hooks/useAnalytics.ts` (plus `web_vitals`, sent from `src/reportWebVitals.ts`).

### Documents

| Event | Description |
|-------|-------------|
| `document_created` | New document created |
| `document_deleted` | Document deleted |
| `document_exported` | Document exported (includes `format`) |

### Markup & Annotations

| Event | Description |
|-------|-------------|
| `annotation_applied` | Markup applied to text (fallacy / rhetoric / structural) |
| `annotation_removed` | Markup removed from text |
| `fallacy_selected` | A fallacy type was chosen from the panel |
| `rhetoric_selected` | A rhetoric type was chosen from the panel |
| `structural_selected` | A structural markup type was chosen from the panel |

### Annotation Visibility & Pinning

| Event | Description |
|-------|-------------|
| `annotation_visibility_toggled` | Single annotation shown/hidden |
| `annotation_bulk_visibility_toggled` | Section/subcategory shown/hidden in bulk |
| `annotation_pinned` | Annotation pinned |
| `annotation_unpinned` | Annotation unpinned |

### Annotation Colors

| Event | Description |
|-------|-------------|
| `annotation_color_changed` | Custom color set for an annotation type |
| `annotation_color_reset` | Annotation type color reset to default |
| `annotation_colors_reset_all` | All annotation colors reset to defaults |

### Speakers

| Event | Description |
|-------|-------------|
| `speaker_assigned` | Speaker assigned to text |
| `speaker_created` | New speaker created |
| `speaker_edited` | Speaker edited |
| `speaker_deleted` | Speaker deleted |

### Speaker Colors

| Event | Description |
|-------|-------------|
| `speaker_color_changed` | Custom color set for a speaker |
| `speaker_color_reset` | Speaker color reset to default |
| `speaker_colors_reset_all` | All speaker colors reset to defaults |

### Versions

| Event | Description |
|-------|-------------|
| `version_created` | Document version snapshot created |
| `version_restored` | Document restored to a previous version |

### Statistics Panel

| Event | Description |
|-------|-------------|
| `stats_panel_opened` | Statistics panel opened |
| `stats_tab_switched` | Switched tab within the statistics panel |
| `stats_breakdown_clicked` | Clicked a breakdown item in statistics |

### Argument Map

| Event | Description |
|-------|-------------|
| `map_view_opened` | Argument map view opened |
| `map_link_created` | Link created between two map blocks |
| `map_link_deleted` | Map link deleted |
| `map_thesis_toggled` | Block marked/unmarked as thesis |
| `map_undo` | Undo in the argument map |
| `map_redo` | Redo in the argument map |

### Sharing & Comments

| Event | Description |
|-------|-------------|
| `share_link_created` | Share link created for a document |
| `shared_doc_viewed` | A shared document was viewed |
| `shared_doc_imported` | A shared document was imported |
| `comment_created` | Comment created |
| `comment_edited` | Comment edited |
| `comment_deleted` | Comment deleted |
| `comment_resolved` | Comment resolved |
| `comment_replied` | Reply added to a comment |

### Search & Settings

| Event | Description |
|-------|-------------|
| `search_used` | Search performed (includes `query`, `resultCount`) |
| `settings_changed` | A setting was changed (includes `setting`, `value`) |

### PWA Install

| Event | Description |
|-------|-------------|
| `pwa_installed` | User installed the PWA |
| `pwa_prompt_shown` | Install prompt displayed |
| `pwa_prompt_dismissed` | User dismissed the install prompt |

### Performance

| Event | Description |
|-------|-------------|
| `web_vitals` | Core Web Vitals metric reported (sent from `reportWebVitals`, not the `useAnalytics` hook) |

## Privacy

Umami is GDPR-compliant and privacy-friendly:
- No cookies required
- No personal data collected
- All data owned by you
- No data sharing with third parties
