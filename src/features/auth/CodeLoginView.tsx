import { ArrowLeft, ArrowRight, CheckCircle2, Hash, Mail, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuthStore } from '../../shared/store/authStore'
import { AuthInput } from './AuthInput'
import { getAuthErrorMessage } from './authFormUtils'

interface CodeLoginViewProps {
  onBackToPasswordLogin: () => void
  onSwitchToRegister: () => void
  onAuthenticated: () => void
}

interface CodeLoginErrors {
  account?: string
  code?: string
  form?: string
}

const COUNTDOWN_SECONDS = 60

export function CodeLoginView({ onBackToPasswordLogin, onSwitchToRegister, onAuthenticated }: CodeLoginViewProps) {
  const sendCode = useAuthStore((state) => state.sendCode)
  const loginByCode = useAuthStore((state) => state.loginByCode)
  const [account, setAccount] = useState('')
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState<CodeLoginErrors>({})
  const [isSending, setIsSending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSentCode, setHasSentCode] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (countdown <= 0) {
      return
    }

    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [countdown])

  function handleAccountChange(value: string) {
    setAccount(value)
    setErrors((current) => ({ ...current, account: undefined, form: undefined }))

    if (hasSentCode) {
      setHasSentCode(false)
      setCode('')
      setCountdown(0)
    }
  }

  function handleCodeChange(value: string) {
    setCode(value.replace(/\D/g, '').slice(0, 6))
    setErrors((current) => ({ ...current, code: undefined, form: undefined }))
  }

  async function handleSendCode() {
    const accountError = validateAccount(account)

    if (accountError) {
      setErrors((current) => ({ ...current, account: accountError }))
      setHasSentCode(false)
      setCountdown(0)
      return
    }

    setErrors({})
    setIsSending(true)
    try {
      await sendCode({ account: account.trim(), scene: 'login' })
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

    if (!hasSentCode) {
      setErrors((current) => ({ ...current, code: '请先获取验证码' }))
      return
    }

    const nextErrors: CodeLoginErrors = {}
    const accountError = validateAccount(account)

    if (accountError) {
      nextErrors.account = accountError
    }

    if (!code) {
      nextErrors.code = '请输入验证码'
    } else if (!/^\d{6}$/.test(code)) {
      nextErrors.code = '验证码为 6 位数字'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      await loginByCode({ account: account.trim(), code })
      onAuthenticated()
    } catch (error) {
      setErrors({ form: getAuthErrorMessage(error, '验证码登录失败') })
    } finally {
      setIsSubmitting(false)
    }
  }

  const canResend = countdown === 0 && !isSending
  const sendButtonText = isSending ? '正在发送...' : countdown > 0 ? `${countdown} 秒后重发` : hasSentCode ? '重新发送' : '获取验证码'

  return (
    <>
      <div>
        <button
          type="button"
          onClick={onBackToPasswordLogin}
          aria-label="返回密码登录"
          className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full p-2 font-label-md text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
        >
          <ArrowLeft className="size-5" />
          <span className="hidden pr-1 sm:inline">返回密码登录</span>
        </button>
        <div className="pt-8 text-center">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">验证码登录</h1>
          <p className="mt-2 font-body-md text-body-md text-on-surface-variant">输入手机号或邮箱获取 6 位验证码（Mock 固定为 123456）。</p>
        </div>
      </div>

      <form className="flex w-full flex-col gap-stack-md" onSubmit={(event) => void handleSubmit(event)} noValidate>
        <AuthInput
          label="手机号或邮箱"
          value={account}
          onChange={handleAccountChange}
          placeholder="请输入手机号或邮箱"
          icon={Mail}
          error={errors.account}
          disabled={isSending || isSubmitting}
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
          <div className="rounded-3xl border border-primary-fixed/50 bg-primary-fixed/20 px-4 py-3 text-on-surface" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <div>
                <p className="font-label-md text-label-md text-on-surface">验证码已发送</p>
                <p className="mt-1 font-body-sm text-body-sm text-on-surface-variant">开发 Mock 模式下验证码为 123456。</p>
              </div>
            </div>
          </div>
        ) : null}

        {hasSentCode ? (
          <AuthInput
            label="验证码"
            value={code}
            onChange={handleCodeChange}
            placeholder="请输入验证码"
            type="text"
            icon={Hash}
            error={errors.code}
            disabled={isSubmitting}
            autoComplete="one-time-code"
          />
        ) : null}

        {errors.form ? (
          <p className="px-2 font-label-sm text-label-sm text-error" role="alert">
            {errors.form}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || !hasSentCode}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-label-md text-label-md text-on-primary transition-all hover:bg-primary-container hover:text-on-primary-container hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? '正在验证...' : '验证码登录'}
          <ArrowRight className="size-4" />
        </button>
      </form>

      <div className="text-center">
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

function validateAccount(value: string) {
  const account = value.trim()

  if (!account) {
    return '请输入手机号或邮箱'
  }

  if (account.includes('@')) {
    return /^\S+@\S+\.\S+$/.test(account) ? undefined : '请输入有效的邮箱地址'
  }

  return /^\+?\d{7,15}$/.test(account) ? undefined : '请输入有效的手机号'
}
