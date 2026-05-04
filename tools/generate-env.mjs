import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NG_APP_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.SUPABASE_PUBLISHABLE_KEY ??
  process.env.NG_APP_SUPABASE_ANON_KEY ??
  process.env.NG_APP_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(`\nMissing Supabase build environment variables.\n\nSet these in Cloudflare Pages:\n  SUPABASE_URL=https://your-project-ref.supabase.co\n  SUPABASE_ANON_KEY=your anon/public/publishable key\n\nAccepted aliases:\n  NG_APP_SUPABASE_URL\n  SUPABASE_PUBLISHABLE_KEY\n  NG_APP_SUPABASE_ANON_KEY\n  NG_APP_SUPABASE_PUBLISHABLE_KEY\n`);
  process.exit(1);
}

const filePath = resolve('src/environments/environment.prod.ts');
mkdirSync(dirname(filePath), { recursive: true });

writeFileSync(
  filePath,
  `export const environment = {\n  production: true,\n  supabaseUrl: ${JSON.stringify(supabaseUrl)},\n  supabaseAnonKey: ${JSON.stringify(supabaseAnonKey)}\n};\n`
);

console.log('Generated src/environments/environment.prod.ts from build environment variables.');
