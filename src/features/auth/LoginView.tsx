import { ArrowRight, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../shared/store/authStore'
import { AuthInput } from './AuthInput'
import { getAuthErrorMessage } from './authFormUtils'

interface LoginViewProps {
  onSwitchToRegister: () => void
  onAuthenticated: () => void
}

interface LoginErrors {
  account?: string
  password?: string
  form?: string
}

export function LoginView({ onSwitchToRegister, onAuthenticated }: LoginViewProps) {
  const login = useAuthStore((state) => state.login)
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<LoginErrors>({})

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: LoginErrors = {}

    if (!account.trim()) {
      nextErrors.account = '请输入用户名'
    }

    if (!password) {
      nextErrors.password = '请输入密码'
    } else if (password.length < 6) {
      nextErrors.password = '密码至少需要 6 位'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      await login({ account: account.trim(), password })
      onAuthenticated()
    } catch (error) {
      setErrors({ form: getAuthErrorMessage(error, '登录失败，请检查账号或密码') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="text-center">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">欢迎回来</h1>
        <p className="mt-2 font-body-md text-body-md text-on-surface-variant">登录您的灵感空间</p>
      </div>

      <form className="flex w-full flex-col gap-stack-md" onSubmit={(event) => void handleSubmit(event)}>
        <AuthInput
          label="用户名"
          value={account}
          onChange={(value) => {
            setAccount(value)
            setErrors((current) => ({ ...current, account: undefined, form: undefined }))
          }}
          placeholder="用户名"
          icon={User}
          error={errors.account}
          disabled={isSubmitting}
          autoComplete="username"
        />
        <AuthInput
          label="密码"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setErrors((current) => ({ ...current, password: undefined, form: undefined }))
          }}
          placeholder="密码"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          error={errors.password}
          disabled={isSubmitting}
          autoComplete="current-password"
          rightAction={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className={`rounded-full p-1 transition-colors ${errors.password ? 'text-error hover:text-on-error-container' : 'text-on-surface-variant hover:text-primary'}`}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
            >
              {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
            </button>
          }
        />

        {errors.form ? (
          <p className="px-2 font-label-sm text-label-sm text-error" role="alert">
            {errors.form}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
        >
          {isSubmitting ? '正在验证...' : '登录'}
          <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="mt-2 text-center">
        <p className="font-label-md text-label-md text-on-surface-variant">
          没有账号？
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="ml-1 font-semibold text-primary underline decoration-primary/30 underline-offset-4 transition-colors hover:text-primary-container hover:decoration-primary"
          >
            立即注册
          </button>
        </p>
      </div>
    </>
  )
}
