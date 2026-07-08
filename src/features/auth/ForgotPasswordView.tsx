import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AuthInput } from './AuthInput'

interface ForgotPasswordViewProps {
  onBackToLogin: () => void
}

type ForgotPasswordStep = 'request' | 'sent' | 'verifying' | 'verified' | 'reset' | 'success'

interface ForgotPasswordErrors {
  email?: string
  password?: string
  confirmPassword?: string
}

export function ForgotPasswordView({ onBackToLogin }: ForgotPasswordViewProps) {
  const [step, setStep] = useState<ForgotPasswordStep>('request')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<ForgotPasswordErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      clearPendingDelay()
    }
  }, [])

  function clearPendingDelay() {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function runDelayed(callback: () => void) {
    clearPendingDelay()

    timeoutRef.current = window.setTimeout(() => {
      timeoutRef.current = null
      callback()
    }, 450)
  }

  function handleRequestSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedEmail = email.trim()
    const nextErrors: ForgotPasswordErrors = {}

    if (!trimmedEmail) {
      nextErrors.email = '请输入邮箱地址'
    } else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) {
      nextErrors.email = '请输入有效的邮箱地址'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStep('request')
      return
    }

    setErrors({})
    setStep('request')
    setIsSubmitting(true)
    runDelayed(() => {
      setIsSubmitting(false)
      setStep('sent')
    })
  }

  function handleVerifyLink() {
    if (isSubmitting) {
      return
    }

    setErrors({})
    setStep('verifying')
    runDelayed(() => setStep('verified'))
  }

  function handleResetSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: ForgotPasswordErrors = {}

    if (!password) {
      nextErrors.password = '请输入新密码'
    } else if (password.length < 8) {
      nextErrors.password = '新密码至少需要 8 位'
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = '请再次输入新密码'
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = '两次输入的密码不一致'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    runDelayed(() => {
      setIsSubmitting(false)
      setStep('success')
    })
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    if (errors.email) {
      setErrors((current) => ({ ...current, email: undefined }))
    }
    if (step !== 'request') {
      clearPendingDelay()
      setIsSubmitting(false)
      setStep('request')
    }
  }

  function handleBackToLogin() {
    clearPendingDelay()
    onBackToLogin()
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    if (errors.password) {
      setErrors((current) => ({ ...current, password: undefined }))
    }
  }

  function handleConfirmPasswordChange(value: string) {
    setConfirmPassword(value)
    if (errors.confirmPassword) {
      setErrors((current) => ({ ...current, confirmPassword: undefined }))
    }
  }

  const isRequestStep = step === 'request' || step === 'sent'

  return (
    <>
      <div>
        <button
          type="button"
          onClick={handleBackToLogin}
          aria-label="返回登录"
          className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full p-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
        >
          <ArrowLeft className="size-5" />
          <span className="hidden pr-1 sm:inline">返回登录</span>
        </button>
        <div className="pt-8 text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface">{getStepTitle(step)}</h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{getStepDescription(step)}</p>
        </div>
      </div>

      {isRequestStep ? (
        <form className="flex w-full flex-col gap-stack-md" onSubmit={handleRequestSubmit} noValidate>
          <AuthInput
            label="邮箱地址"
            value={email}
            onChange={handleEmailChange}
            placeholder="请输入邮箱地址"
            type="email"
            icon={Mail}
            error={errors.email}
            disabled={isSubmitting}
            autoComplete="email"
          />

          {step === 'sent' ? (
            <div className="rounded-3xl border border-primary-fixed/50 bg-primary-fixed/20 px-4 py-3 text-on-surface" role="status" aria-live="polite">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <p className="font-label-md text-label-md text-on-surface">发送成功</p>
                  <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">这是模拟邮件流程。如果该邮箱已注册，您将收到密码重置说明。</p>
                </div>
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:text-on-primary-container hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
          >
            {isSubmitting ? '正在发送...' : step === 'sent' ? '重新发送' : '发送重置说明'}
            <Send className="size-4" />
          </button>

          {step === 'sent' ? (
            <button
              type="button"
              onClick={handleVerifyLink}
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-outline-variant/40 bg-surface px-4 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
            >
              我已通过邮件链接进入
              <ShieldCheck className="size-4" />
            </button>
          ) : null}
        </form>
      ) : null}

      {step === 'verifying' ? (
        <StatusCard icon="shield" title="正在验证重置链接..." description="正在模拟校验邮件链接和重置凭证，请稍候。" busy />
      ) : null}

      {step === 'verified' ? (
        <div className="flex flex-col gap-stack-md">
          <StatusCard icon="check" title="链接验证成功" description="你现在可以设置新的登录密码。此处为模拟验证，不校验真实邮件 token。" />
          <button
            type="button"
            onClick={() => setStep('reset')}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:text-on-primary-container hover:shadow-md active:scale-[0.98]"
          >
            设置新密码
            <Lock className="size-4" />
          </button>
        </div>
      ) : null}

      {step === 'reset' ? (
        <form className="flex w-full flex-col gap-stack-md" onSubmit={handleResetSubmit} noValidate>
          <AuthInput
            label="新密码"
            value={password}
            onChange={handlePasswordChange}
            placeholder="新密码"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="new-password"
            rightAction={<PasswordToggleButton showPassword={showPassword} onToggle={() => setShowPassword((value) => !value)} hasError={Boolean(errors.password)} disabled={isSubmitting} />}
          />
          <AuthInput
            label="确认新密码"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="确认新密码"
            type={showPassword ? 'text' : 'password'}
            icon={Lock}
            error={errors.confirmPassword}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:text-on-primary-container hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
          >
            {isSubmitting ? '正在重置...' : '重置密码'}
            <ShieldCheck className="size-4" />
          </button>
        </form>
      ) : null}

      {step === 'success' ? (
        <div className="flex flex-col gap-stack-md">
          <StatusCard icon="check" title="密码已重置" description="你的密码已经更新，请使用新密码重新登录。此处为模拟重置，不会写入真实账号系统。" />
          <button
            type="button"
            onClick={handleBackToLogin}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:text-on-primary-container hover:shadow-md active:scale-[0.98]"
          >
            返回登录
            <ArrowLeft className="size-4" />
          </button>
        </div>
      ) : null}
    </>
  )
}

function getStepTitle(step: ForgotPasswordStep) {
  if (step === 'verified') {
    return '链接验证成功'
  }

  if (step === 'reset') {
    return '设置新密码'
  }

  if (step === 'success') {
    return '密码已重置'
  }

  return '找回密码'
}

function getStepDescription(step: ForgotPasswordStep) {
  if (step === 'sent') {
    return '请确认邮件中的重置入口。你也可以在这里继续模拟后续流程。'
  }

  if (step === 'verifying') {
    return '正在验证重置链接...'
  }

  if (step === 'verified') {
    return '你现在可以设置新的登录密码。'
  }

  if (step === 'reset') {
    return '请输入一个新的安全密码，并再次确认。'
  }

  if (step === 'success') {
    return '请使用新密码重新登录。'
  }

  return '输入注册邮箱，我们会模拟发送一封重置说明邮件。'
}

function StatusCard({ icon, title, description, busy = false }: { icon: 'check' | 'shield'; title: string; description: string; busy?: boolean }) {
  const Icon = icon === 'check' ? CheckCircle2 : ShieldCheck

  return (
    <div className="rounded-3xl border border-primary-fixed/50 bg-primary-fixed/20 px-4 py-4 text-on-surface" role="status" aria-live="polite">
      <div className="flex items-start gap-3">
        <Icon className={`mt-0.5 size-5 shrink-0 text-primary ${busy ? 'animate-pulse' : ''}`} />
        <div>
          <p className="font-label-md text-label-md text-on-surface">{title}</p>
          <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">{description}</p>
        </div>
      </div>
    </div>
  )
}

function PasswordToggleButton({
  showPassword,
  onToggle,
  hasError,
  disabled,
}: {
  showPassword: boolean
  onToggle: () => void
  hasError: boolean
  disabled: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`rounded-full p-1 transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${hasError ? 'text-error hover:text-on-error-container' : 'text-on-surface-variant hover:text-primary'}`}
      aria-label={showPassword ? '隐藏密码' : '显示密码'}
    >
      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
    </button>
  )
}
