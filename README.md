# ReMember Me

A Progressive Web App (PWA) to help you keep track of the people who matter most in your life. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 📱 Mobile-first responsive design with PWA support
- 👤 Contact management with detailed profiles
- 🎤 **Quick Voice Entry** - Record voice memos and auto-fill contact forms using AI
- 🔍 Advanced search and filtering
- 🌐 Network visualization of relationships
- 🎨 Beautiful UI with Shadcn/ui components
- 🔐 Authentication ready with Supabase
- 💾 Offline-capable Progressive Web App

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui
- **Backend**: Supabase (Auth & Database)
- **PWA**: next-pwa

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Supabase account and project ([Get started free](https://supabase.com))

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

   **Note**: The OpenAI API key is required for the Quick Voice Entry feature (transcription and AI parsing). 
   Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys).

3. **Set up Supabase database**:
   
   The complete database schema is in `supabase-schema.sql`.
   
   **Quick setup:**
   1. Open Supabase Dashboard > SQL Editor
   2. Copy the entire contents of `supabase-schema.sql`
   3. Paste and run in SQL Editor
   
   This creates:
   - 6 tables: persons, tags, person_tags, relationships, attachments, interactions
   - Row Level Security (RLS) policies for data isolation
   - Performance indexes and full-text search
   - Automatic timestamp triggers
   - Helper functions and views
   
   **See `SUPABASE_SETUP.md` for detailed step-by-step instructions.**

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
remember-me/
├── app/                      # Next.js App Router
│   ├── layout.tsx           # Root layout with bottom nav
│   ├── page.tsx             # Home page with contact list
│   ├── contacts/
│   │   ├── new/             # Add new contact
│   │   └── [id]/            # Contact detail page
│   ├── network/             # Relationship network view
│   └── search/              # Advanced search page
├── components/
│   ├── ui/                  # Shadcn/ui components
│   └── bottom-nav.tsx       # Mobile bottom navigation
├── lib/
│   ├── supabase/            # Supabase client configuration
│   │   ├── client.ts        # Browser client
│   │   ├── server.ts        # Server client
│   │   └── middleware.ts    # Auth middleware
│   └── utils.ts             # Utility functions
├── public/                  # Static assets & PWA files
│   └── manifest.json        # PWA manifest
└── middleware.ts            # Next.js middleware for auth
```

## Routes

- `/` - Home page with contact list and quick stats
- `/contacts/new` - Add a new contact
- `/contacts/[id]` - View and edit contact details
- `/network` - Visualize your relationship network
- `/search` - Advanced search with filters

## PWA Setup

The app is configured as a Progressive Web App. To install on mobile:

1. Visit the site on your mobile device
2. Look for the "Add to Home Screen" prompt
3. The app will work offline and feel like a native app

### Adding PWA Icons

Replace the placeholder PWA icons in `/public/`:
- `icon-192.png` - 192x192px app icon
- `icon-512.png` - 512x512px app icon

## Development

### Building for Production

```bash
npm run build
npm start
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Customization

### Brand Colors

The app uses custom brand colors defined in `app/globals.css`:
- **Primary** (Purple): Memory/connection theme
- **Secondary** (Blue): Trust/communication
- **Accent** (Teal): Relationships

You can customize these in the CSS variables section.

### UI Components

All UI components use Shadcn/ui and can be customized via the `components/ui/` directory.

## Next Steps

1. Set up authentication pages (login/signup)
2. Implement actual data fetching from Supabase
3. Add image upload for contact avatars
4. Implement the network graph visualization
5. Add reminder/notification features
6. Create data export functionality

## License

MIT

## Support

For issues and questions, please refer to the documentation or create an issue in the repository.
