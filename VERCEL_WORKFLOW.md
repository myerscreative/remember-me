---
description: Optimized Vercel + Local Dev Workflow for 6-8 personal/side projects on Hobby plan. Minimize deploys, test locally first, use previews selectively, monitor limits to avoid surprises or forced upgrades.
tags: vercel, nextjs, hobby-plan, local-dev, deployment-strategy, cursor-antigravity
priority: high
---

# Vercel Dev Workflow: Local-First for Multiple Apps (Hobby Plan Friendly)

Goal:  
Keep costs at $0 (Hobby), reduce deploy spam, test fast locally, only deploy when needed (real network, previews, prod pushes).  
You're working on 6-8 apps → frequent changes → aim for <50–70 total deploys/day across all projects to stay safely under limits.

## Current Vercel Hobby Limits (Feb 2026 – Critical Ones)

- Deployments created per day: **100** (resets every 24h – across ALL projects/teams!)
- Builds per hour: **32** (rate limit – queues or fails if exceeded)
- Concurrent builds: **1** (everything else waits)
- CLI deploys per week: **2000** (but daily cap is the real bottleneck)
- Projects: **200** max
- Other gotchas: 100 GB bandwidth/mo, 1M edge requests/mo, function invocations ~1M/mo (Fluid Compute), etc.
  → If you hit 100 deploys/day → blocked until next day. Pro jumps to 6000/day + 12 concurrent + $20/mo base.

## Core Principle: Local-First, Deploy Sparingly

80–90% of work → local dev.  
Deploy only for:

- Preview URLs (share/feedback/QA on non-main branches)
- Prod merges (final push to main)
- Vercel-specific testing (Blob/KV/edge quirks, real latency/CDN)
- Verifying prod fixes

## Recommended Daily Workflow

1. **Start Local Dev (Instant Feedback)**
   - Open each app in Cursor / VS Code.
   - Run `npm run dev` (or `pnpm dev`, etc.) → http://localhost:3000
   - Use hot reloading → test UI/logic/API routes instantly.
   - For production-like checks: Occasionally run `npm run build && npm run start`
   - Environment: Use `.env.local` for dev vars (API keys, local DB, etc.)
   - Tip: If Next.js, enable Turbopack in dev (usually default now) for faster compiles.

2. **Commit & Branch Strategy (Minimize Deploys)**
   - Work on feature branches: `git checkout -b feature/add-login`
   - Commit often → small, atomic changes.
   - Push branch → Vercel auto-creates **preview deployment** (e.g. feature-add-login-yourname-app.vercel.app)
     → Use this for real-browser testing, sharing screenshots, etc.
   - **Do NOT** push to main until ready → saves prod deploys.
   - For monorepos (if you combine related apps): Vercel skips unaffected projects → huge time saver.

3. **When to Deploy / Trigger Build**
   - Preview needed? → `git push origin feature-branch`
   - Prod update? → Merge PR to main → auto-deploys to production.
   - Manual CLI deploy (rare): `vercel deploy` or `vercel --prod`
   - Batch changes: Group 3–5 small fixes → one push/deploy instead of 5 separate.

4. **Monitor & Stay Under Limits**
   - Vercel Dashboard → Usage tab (check Deployments, Builds, Bandwidth, Edge Requests)
   - Set usage notifications (even on Hobby).
   - If approaching 100 deploys/day: Pause non-essential previews, test more locally.
   - Dashboard alerts: Watch for "approaching limits" emails (common after spikes).

5. **Optimization Checklist (Reduce Consumption)**
   - Cache static assets aggressively (headers, Next.js Image, etc.)
   - Limit Next.js prefetching on dev/previews if spammy.
   - Block bad bots via Vercel Firewall (if inflating requests).
   - Offload large files (images/videos) to Vercel Blob / external if heavy.
   - Use `vercel ignore` command or `.vercelignore` for junk files.
   - Turn off auto-deploys for scratch/dev branches if testing locally only.

6. **When to Consider Pro Upgrade ($20/mo)**
   - Regularly hit 100 deploys/day or long queues.
   - Need 12 concurrent builds (monorepo + many apps).
   - Want higher bandwidth/functions/edge requests without caps.
   - Team features or faster build machines.
     → For solo + fixed bugs + low traffic → Hobby should be fine with this workflow.

## Quick Commands Reference

- Local dev: `npm run dev`
- Build locally: `npm run build`
- Prod-like local: `npm run build && npm run start`
- Deploy preview: `git push` to branch
- Deploy prod manually: `vercel --prod`
- Check usage: Vercel dashboard > Usage

Follow this → you should rarely hit limits, deploys stay purposeful, and iteration stays fast.  
If a specific app/framework needs tweaks (e.g. Next.js middleware quirks), drop details and we can refine.

Happy coding!
