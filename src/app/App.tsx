import { useState } from 'react'
import { NotesHome } from '../features/notes/NotesHome'
import { NotFoundView } from './NotFoundView'

const validPaths = new Set(['/', '/index.html'])

export default function App() {
  const [path, setPath] = useState(window.location.pathname)

  function handleGoHome() {
    window.history.replaceState(null, '', '/')
    setPath('/')
  }

  if (!validPaths.has(path)) {
    return <NotFoundView onGoHome={handleGoHome} />
  }

  return <NotesHome />
}
