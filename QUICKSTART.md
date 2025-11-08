# Quick Start Guide - ReMember Me

Get up and running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- A code editor (VS Code recommended)

## Setup Steps

### 1. Install Dependencies (2 min)

```bash
cd remember-me
npm install
```

### 2. Configure Environment Variables (1 min)

**Option A: Start with Mock Data (Recommended for testing)**

Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=mock
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock
```

**Option B: Use Real Supabase**

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Get your credentials from Settings > API
4. Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_actual_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_key_here
```

### 3. Run the Development Server (30 sec)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## What You'll See

- **Home Page** (`/`) - Contact list with search
- **Add Contact** (`/contacts/new`) - Form to add new contacts
- **Contact Detail** (`/contacts/[id]`) - View contact information
- **Network** (`/network`) - Visualize relationships
- **Search** (`/search`) - Advanced search with filters

## Next Steps

### If Using Mock Data
The app will work immediately with sample data. Start exploring the UI!

### If Using Real Supabase
1. Go to your Supabase dashboard
2. SQL Editor > New Query
3. Copy the schema from `README.md`
4. Run the SQL to create tables
5. Enable authentication in Authentication > Settings

## Mobile Testing

### Test as PWA on Mobile

**Option 1: Using ngrok**
```bash
npm install -g ngrok
ngrok http 3000
```
Visit the ngrok URL on your mobile device

**Option 2: Same Network**
1. Find your computer's local IP (e.g., 192.168.1.x)
2. Visit `http://YOUR_IP:3000` on your phone
3. Add to home screen

## Common Issues

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Build Errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Environment Variables Not Loading
- Restart dev server after changing `.env.local`
- Make sure file is named exactly `.env.local`

## Development Tips

### Hot Reload
The app auto-reloads when you save files. No need to restart!

### TypeScript Errors
```bash
npm run type-check
```

### View Component Library
All UI components are in `components/ui/`

### Add More Shadcn Components
```bash
npx shadcn@latest add [component-name]
```

## File Structure Quick Reference

```
app/
├── page.tsx              # Home - edit the contact list
├── layout.tsx            # Root layout - add global changes
├── contacts/
│   ├── new/page.tsx     # Add contact form
│   └── [id]/page.tsx    # Contact details
├── network/page.tsx      # Network visualization
└── search/page.tsx       # Search page

components/
├── bottom-nav.tsx        # Mobile navigation bar
└── ui/                   # Reusable UI components

lib/
└── supabase/            # Database client setup
```

## Customization

### Change Colors
Edit `app/globals.css` - look for the `:root` and `.dark` sections

### Change App Name
- `app/layout.tsx` - Update metadata
- `public/manifest.json` - Update PWA name

### Add New Pages
Create `app/your-page/page.tsx`

## Need Help?

- Check `README.md` for detailed documentation
- Check Next.js docs: [nextjs.org/docs](https://nextjs.org/docs)
- Check Supabase docs: [supabase.com/docs](https://supabase.com/docs)

## Ready to Deploy?

```bash
npm run build
npm start
```

Deploy to Vercel:
```bash
npm i -g vercel
vercel
```

---

**You're all set!** Start building your personal CRM 🚀

