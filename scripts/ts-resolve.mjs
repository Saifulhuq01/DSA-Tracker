// Lets plain Node (22.6+) import the app's TypeScript modules for checks:
// maps `@/x` → `src/x` and adds the missing `.ts` / `.tsx` extension.
// Usage: node --import ./scripts/ts-resolve.mjs --experimental-transform-types <file.ts>
import { register } from 'node:module';
import { statSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve as resolvePath } from 'node:path';

if (!process.env.__TS_RESOLVE_HOOK) {
  process.env.__TS_RESOLVE_HOOK = '1';
  register(import.meta.url);
}

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function withExtension(path) {
  for (const candidate of [path, `${path}.ts`, `${path}.tsx`, join(path, 'index.ts')]) {
    try { if (statSync(candidate).isFile()) return candidate; } catch { /* try next */ }
  }
  return null;
}

export async function resolve(specifier, context, next) {
  let target = null;
  if (specifier.startsWith('@/')) {
    target = withExtension(join(SRC, specifier.slice(2)));
  } else if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL?.startsWith('file:')) {
    target = withExtension(resolvePath(dirname(fileURLToPath(context.parentURL)), specifier));
  }
  return next(target ? pathToFileURL(target).href : specifier, context);
}

// Node can't erase `import { SomeInterface } from './x'` on its own (the app's bundler can).
// In memory only, mark named imports that are interfaces/types in the target module as
// `import type`, so data files load without being edited.
const IMPORT_RE = /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]\s*;?/g;

function typeOnlyNames(file) {
  try {
    const src = readFileSync(file, 'utf8');
    return new Set([...src.matchAll(/export\s+(?:interface|type)\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]));
  } catch { return new Set(); }
}

export async function load(url, context, next) {
  const result = await next(url, context);
  if (!/\.tsx?$/.test(url) || !url.startsWith('file:') || result.source == null) return result;
  const file = fileURLToPath(url);
  const source = String(result.source).replace(IMPORT_RE, (stmt, names, spec) => {
    const target = spec.startsWith('@/') ? withExtension(join(SRC, spec.slice(2)))
      : spec.startsWith('.') ? withExtension(resolvePath(dirname(file), spec)) : null;
    if (!target) return stmt;
    const types = typeOnlyNames(target);
    const parts = names.split(',').map((n) => n.trim()).filter(Boolean);
    const rewritten = parts.map((n) => (!n.startsWith('type ') && types.has(n.split(/\s+as\s+/)[0]) ? `type ${n}` : n));
    return rewritten.join() === parts.join() ? stmt : `import { ${rewritten.join(', ')} } from '${spec}';`;
  });
  return { ...result, source };
}
