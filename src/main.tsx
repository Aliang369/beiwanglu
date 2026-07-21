import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app/App'
import { initLocalBackend } from './shared/data/localBackend'
import { useAuthStore } from './shared/store/authStore'
import { useSyncStore } from './shared/store/syncStore'
import './styles/global.css'

async function bootstrap() {
  useAuthStore.getState().hydrate()
  useSyncStore.getState().hydrate()

  try {
    await initLocalBackend()
  } catch (error) {
    console.error('[bootstrap] local backend init failed', error)
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
