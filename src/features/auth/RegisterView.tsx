import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../shared/store/authStore'
import { AgreementModal } from './AgreementModal'
import { AuthInput } from './AuthInput'
import { getAuthErrorMessage } from './authFormUtils'

interface RegisterViewProps {
  onSwitchToLogin: () => void
  onRegistered: () => void
}

interface RegisterErrors {
  username?: string
  email?: string
  password?: string
  confirmPassword?: string
  terms?: string
  form?: string
}

export function RegisterView({ onSwitchToLogin, onRegistered }: RegisterViewProps) {
  const register = useAuthStore((state) => state.register)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<RegisterErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [agreementModal, setAgreementModal] = useState<null | 'terms' | 'privacy'>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: RegisterErrors = {}

    if (!username.trim()) {
      nextErrors.username = '请输入用户名'
    }

    if (!email.trim()) {
      nextErrors.email = '请输入邮箱地址'
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = '请输入有效的邮箱地址'
    }

    if (!password) {
      nextErrors.password = '请输入密码'
    } else if (password.length < 6) {
      nextErrors.password = '密码至少需要 6 位'
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = '请再次输入密码'
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = '两次输入的密码不一致'
    }

    if (!acceptedTerms) {
      nextErrors.terms = '请先同意服务条款和隐私政策'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setSuccessMessage(null)
    setIsSubmitting(true)
    try {
      await register({
        account: email.trim(),
        password,
        name: username.trim(),
      })
      setSuccessMessage('注册成功，请使用账号登录')
      window.setTimeout(() => {
        onRegistered()
      }, 900)
    } catch (error) {
      setErrors({ form: getAuthErrorMessage(error, '注册失败，请稍后重试') })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <div className="text-center">
        <h2 className="mb-2 font-headline-md text-headline-md text-on-surface">加入灵感笔录</h2>
        <p className="font-label-md text-label-md text-on-surface-variant">开启您的纯净记录之旅</p>
      </div>

      <form className="space-y-stack-md" onSubmit={(event) => void handleSubmit(event)}>
        <AuthInput
          label="用户名"
          value={username}
          onChange={(value) => {
            setUsername(value)
            setErrors((current) => ({ ...current, username: undefined, form: undefined }))
          }}
          placeholder="用户名"
          icon={User}
          error={errors.username}
          disabled={isSubmitting}
          autoComplete="username"
        />
        <AuthInput
          label="邮箱地址"
          value={email}
          onChange={(value) => {
            setEmail(value)
            setErrors((current) => ({ ...current, email: undefined, form: undefined }))
          }}
          placeholder="邮箱地址"
          type="email"
          icon={Mail}
          error={errors.email}
          disabled={isSubmitting}
          autoComplete="email"
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
          autoComplete="new-password"
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
        <AuthInput
          label="确认密码"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value)
            setErrors((current) => ({ ...current, confirmPassword: undefined, form: undefined }))
          }}
          placeholder="确认密码"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 pt-1">
          <input
            checked={acceptedTerms}
            onChange={(event) => {
              setAcceptedTerms(event.target.checked)
              setErrors((current) => ({ ...current, terms: undefined }))
            }}
            className="mt-0.5 size-4 rounded border-outline text-primary focus:ring-primary"
            type="checkbox"
            disabled={isSubmitting}
          />
          <span className="font-label-md text-label-md text-on-surface-variant">
            我已阅读并同意
            <button type="button" onClick={() => setAgreementModal('terms')} className="mx-1 text-primary underline-offset-2 hover:underline">服务条款</button>
            和
            <button type="button" onClick={() => setAgreementModal('privacy')} className="mx-1 text-primary underline-offset-2 hover:underline">隐私政策</button>
          </span>
        </label>
        {errors.terms ? <p className="px-2 font-label-sm text-label-sm text-error">{errors.terms}</p> : null}
        {errors.form ? (
          <p className="px-2 font-label-sm text-label-sm text-error" role="alert">
            {errors.form}
          </p>
        ) : null}
        {successMessage ? (
          <div className="rounded-2xl border border-primary-fixed/50 bg-primary-fixed/20 px-4 py-3" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="font-label-md text-label-md text-on-surface">{successMessage}</p>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || Boolean(successMessage)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-3 font-label-md text-label-md text-on-primary shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-primary-container hover:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
        >
          {isSubmitting ? '正在创建...' : successMessage ? '即将跳转登录...' : '立即注册'}
          <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="text-center">
        <p className="font-label-md text-label-md text-on-surface-variant">
          已有账号？
          <button type="button" onClick={onSwitchToLogin} className="ml-1 font-medium text-primary underline-offset-4 transition-colors hover:text-surface-tint hover:underline">
            立即登录
          </button>
        </p>
      </div>
      {agreementModal ? <AgreementModal type={agreementModal} onClose={() => setAgreementModal(null)} /> : null}
    </>
  )
}
