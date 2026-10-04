# Shop Inventory
1. Create a project at supabase.com, then run `supabase/schema.sql` in the SQL Editor.
2. `cp .env.example .env` and fill in Project URL + anon/publishable key (Project Settings -> API). Never use the service-role key.
3. `npm install && npm run dev`. On Vercel, add the same two variables under Project Settings -> Environment Variables.
4. Optional live sync between devices: run `supabase/realtime.sql` once. (The app also refreshes whenever you return to the tab.)
5. Deploy: push to GitHub, import the repo in Vercel (Vite is auto-detected), add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`, deploy. Locally, check with `npm run build && npm run preview`.
