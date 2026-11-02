import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/instrument-sans'
import '@fontsource/instrument-serif'
import './styles/index.css'
import { STORAGE_KEY, useApp } from './store'
import { App } from './App'

// A round that ran out while the app was closed is logged before the first paint.
useApp.getState().resumeOnLoad()

// Another tab saved: load its state rather than overwrite it with ours on our next write.
addEventListener('storage', (e) => {
  if (e.key === STORAGE_KEY) useApp.persist.rehydrate()
})

// Dev and e2e only: lets tests fast-forward a timer. Stripped from production builds.
if (import.meta.env.DEV) Object.assign(window, { __app: useApp })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
