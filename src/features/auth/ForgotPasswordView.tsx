import { ArrowLeft, CheckCircle2, Eye, EyeOff, Hash, Lock, Mail, Send, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../shared/store/authStore'
import { AuthInput } from './AuthInput'
import { getAuthErrorMessage } from './authFormUtils'

interface ForgotPasswordViewProps {
  onBackToLogin: () => void
}

interface ForgotPasswordErrors {
  account?: string
  code?: string
  password?: string
  confirmPassword?: string
  form?: string
}

const COUNTDOWN_SECONDS = 60

export function ForgotPasswordView({ onBackToLogin }: ForgotPasswordViewProps) {
  const sendCode = useAuthStore((state) => state.sendCode)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const [account, setAccount] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<ForgotPasswordErrors>({})
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSentCode, setHasSentCode] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  async function handleSendCode() {
    const trimmed = account.trim()
    if (!trimmed) {
      setErrors({ account: '请输入邮箱或手机号' })
      return
    }
    if (trimmed.includes('@') && !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setErrors({ account: '请输入有效的邮箱地址' })
      return
    }

    setErrors({})
    setIsSending(true)
    try {
      await sendCode({ account: trimmed, scene: 'reset_password' })
      setHasSentCode(true)
      setCountdown(COUNTDOWN_SECONDS)
    } catch (error) {
      setErrors({ form: getAuthErrorMessage(error, '验证码发送失败') })
    } finally {
      setIsSending(false)
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextErrors: ForgotPasswordErrors = {}
    const trimmed = account.trim()

    if (!trimmed) {
      nextErrors.account = '请输入邮箱或手机号'
    }

    if (!hasSentCode) {
      nextErrors.code = '请先获取验证码'
    } else if (!code) {
      nextErrors.code = '请输入验证码'
    } else if (!/^\d{6}$/.test(code)) {
      nextErrors.code = '验证码为 6 位数字'
    }

    if (!password) {
      nextErrors.password = '请输入新密码'
    } else if (password.length < 6) {
      nextErrors.password = '新密码至少需要 6 位'
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
    try {
      await resetPassword({
        account: trimmed,
        code,
        newPassword: password,
      })
      setSuccess(true)
    } catch (error) {
      setErrors({ form: getAuthErrorMessage(error, '重置密码失败') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canResend = countdown === 0 && !isSending
  const sendButtonText = isSending ? '正在发送...' : countdown > 0 ? `${countdown} 秒后重发` : hasSentCode ? '重新发送' : '获取验证码'

  if (success) {
    return (
      <>
        <div className="pt-8 text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface">密码已重置</h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">请使用新密码登录账号。</p>
        </div>
        <div className="rounded-3xl border border-primary-fixed/50 bg-primary-fixed/20 px-4 py-4" role="status">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="font-label-md text-label-md text-on-surface">重置成功，接下来请返回登录页。</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToLogin}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:shadow-md active:scale-[0.98]"
        >
          返回登录
          <ArrowLeft className="size-4" />
        </button>
      </>
    )
  }

  return (
    <>
      <div>
        <button
          type="button"
          onClick={onBackToLogin}
          aria-label="返回登录"
          className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full p-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
        >
          <ArrowLeft className="size-5" />
          <span className="hidden pr-1 sm:inline">返回登录</span>
        </button>
        <div className="pt-8 text-center">
          <h2 className="font-headline-md text-headline-md text-on-surface">找回密码</h2>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">通过验证码重置密码（Mock 验证码 123456）。</p>
        </div>
      </div>

      <form className="flex w-full flex-col gap-stack-md" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <AuthInput
          label="邮箱或手机号"
          value={account}
          onChange={(value) => {
            setAccount(value)
            setErrors((current) => ({ ...current, account: undefined, form: undefined }))
            if (hasSentCode) {
              setHasSentCode(false)
              setCode('')
              setCountdown(0)
            }
          }}
          placeholder="请输入邮箱或手机号"
          icon={Mail}
          error={errors.account}
          disabled={isSubmitting || isSending}
          autoComplete="username"
        />

        <button
          type="button"
          onClick={() => void handleSendCode()}
          disabled={!canResend || isSubmitting}
          className="flex w-full items-center justify-center gap-2 rounded-full border border-outline-variant/40 bg-surface px-4 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sendButtonText}
          <Send className="size-4" />
        </button>

        {hasSentCode ? (
          <div className="rounded-3xl border border-primary-fixed/50 bg-primary-fixed/20 px-4 py-3" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <p className="font-label-md text-label-md text-on-surface">验证码已发送，Mock 固定为 123456。</p>
            </div>
          </div>
        ) : null}

        <AuthInput
          label="验证码"
          value={code}
          onChange={(value) => {
            setCode(value.replace(/\D/g, '').slice(0, 6))
            setErrors((current) => ({ ...current, code: undefined, form: undefined }))
          }}
          placeholder="请输入 6 位验证码"
          icon={Hash}
          error={errors.code}
          disabled={isSubmitting}
          autoComplete="one-time-code"
        />

        <AuthInput
          label="新密码"
          value={password}
          onChange={(value) => {
            setPassword(value)
            setErrors((current) => ({ ...current, password: undefined, form: undefined }))
          }}
          placeholder="新密码至少 6 位"
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
          label="确认新密码"
          value={confirmPassword}
          onChange={(value) => {
            setConfirmPassword(value)
            setErrors((current) => ({ ...current, confirmPassword: undefined, form: undefined }))
          }}
          placeholder="再次输入新密码"
          type={showPassword ? 'text' : 'password'}
          icon={Lock}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          autoComplete="new-password"
        />

        {errors.form ? (
          <p className="px-2 font-label-sm text-label-sm text-error" role="alert">
            {errors.form}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:shadow-md active:scale-[0.98] disabled:cursor-wait disabled:opacity-80"
        >
          {isSubmitting ? '正在重置...' : '重置密码'}
          <ShieldCheck className="size-4" />
        </button>
      </form>
    </>
  )
}
