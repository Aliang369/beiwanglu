import { X } from 'lucide-react'
import { useEffect } from 'react'
import { ForgotPasswordView } from './ForgotPasswordView'
import { LoginView } from './LoginView'
import { RegisterView } from './RegisterView'

export type AuthMode = 'login' | 'register' | 'forgot-password'

interface AuthModalProps {
  mode: AuthMode
  onModeChange: (mode: AuthMode) => void
  onClose: () => void
}

export function AuthModal({ mode, onModeChange, onClose }: AuthModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const modalLabel = mode === 'login' ? '登录' : mode === 'register' ? '注册' : '找回密码'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={modalLabel}>
      <button type="button" className="absolute inset-0 bg-inverse-surface/35 backdrop-blur-sm" onClick={onClose} aria-label="关闭登录注册弹窗" />
      <div className="relative max-h-[calc(100vh-32px)] w-full max-w-md overflow-y-auto rounded-3xl border border-outline-variant/30 bg-surface p-8 shadow-modal sm:p-10">
        <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-primary-fixed to-primary" />
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
          aria-label="关闭"
        >
          <X className="size-5" />
        </button>
        <div className="flex flex-col gap-stack-lg">
          {mode === 'login' ? (
            <LoginView onSwitchToRegister={() => onModeChange('register')} onForgotPassword={() => onModeChange('forgot-password')} onAuthenticated={onClose} />
          ) : mode === 'register' ? (
            <RegisterView onSwitchToLogin={() => onModeChange('login')} onRegistered={onClose} />
          ) : (
            <ForgotPasswordView onBackToLogin={() => onModeChange('login')} />
          )}
        </div>
      </div>
    </div>
  )
}
