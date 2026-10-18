import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// No GitHub Pages o app fica em /nome-do-repositorio/
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]

// Gera a lista de arquivos do build para o service worker guardar
function precacheManifest() {
  return {
    name: 'precache-manifest',
    apply: 'build',
    generateBundle(_options, bundle) {
      const emitted = Object.values(bundle)
        .map((item) => item.fileName)
        .filter((file) => !file.endsWith('.map'))

      const files = [
        ...new Set([
          'index.html',
          ...emitted,
          'manifest.webmanifest',
          'icon.svg',
          'icon-192.png',
          'icon-512.png',
        ]),
      ]

      this.emitFile({
        type: 'asset',
        fileName: 'precache-manifest.json',
        source: JSON.stringify(files, null, 2),
      })
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS && repository ? `/${repository}/` : '/',
  plugins: [react(), tailwindcss(), precacheManifest()],
})
