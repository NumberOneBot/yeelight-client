import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  clean: true,
  bundle: true,
  banner: { js: '#!/usr/bin/env node' }
})
