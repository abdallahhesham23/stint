import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Maskable and Apple icons are cropped by the OS, so they get a full-bleed teal ground instead of white padding.
const teal = { background: '#1b6e66', fit: 'contain' } as const

export default defineConfig({
  preset: {
    ...minimal2023Preset,
    maskable: { ...minimal2023Preset.maskable, padding: 0.12, resizeOptions: teal },
    apple: { ...minimal2023Preset.apple, padding: 0.12, resizeOptions: teal },
  },
  images: ['public/icon.svg'],
})
