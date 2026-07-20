import { getApiBaseUrl } from '../config'
import { getAccessToken } from '../tokenStorage'
import { ApiError } from '../types'
import { isMockApiMode } from '../config'

/**
 * 远端文件上传 API。
 * 字段契约见 docs/api-contract.md §5.4。
 *
 * 注意：fetch multipart 不能由 httpClient.request 统一封装（会错误设置 Content-Type），
 * 这里独立实现，但仍走统一的 token 注入与错误处理。
 */
export const uploadsApi = {
  /**
   * 上传图片。返回相对路径 URL，如 /uploads/{user_id}/{uuid}.png。
   * 调用方需要自行拼接 API base URL 的 origin 后用于 <img src>。
   */
  async uploadImage(file: File): Promise<string> {
    if (isMockApiMode()) {
      // Mock 模式：本地转 dataURL 返回，不调远端
      return readFileAsDataUrl(file)
    }

    const formData = new FormData()
    formData.append('file', file)

    const base = getApiBaseUrl()
    // 上传接口路径：base 末尾是 /api/v1，上传接口是 /api/v1/uploads/image
    const url = `${base.replace(/\/$/, '')}/uploads/image`

    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    const token = getAccessToken()
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      })
    } catch (error) {
      throw new ApiError({
        kind: 'network',
        message: error instanceof Error ? error.message : '网络异常',
        details: error,
      })
    }

    const text = await response.text()
    let payload: unknown = null
    if (text) {
      try {
        payload = JSON.parse(text)
      } catch {
        throw new ApiError({
          kind: 'parse',
          message: '响应不是合法 JSON',
          status: response.status,
          details: text,
        })
      }
    }

    if (
      typeof payload === 'object' &&
      payload !== null &&
      'code' in payload &&
      (payload as { code: number }).code !== 0
    ) {
      const errPayload = payload as { code: number; message: string; data: unknown }
      throw new ApiError({
        kind: errPayload.code === 401 ? 'unauthorized' : 'business',
        message: errPayload.message || '上传失败',
        code: errPayload.code,
        status: response.status,
        details: errPayload.data,
      })
    }

    const data = (payload as { data?: { url?: string } } | null)?.data
    if (!data || typeof data.url !== 'string') {
      throw new ApiError({
        kind: 'parse',
        message: '上传响应缺少 url 字段',
        status: response.status,
        details: payload,
      })
    }

    return data.url
  },

  /**
   * 将远端返回的相对路径（/uploads/...）拼接成完整可访问 URL。
   * 用于 <img src>。
   */
  resolveUrl(relativeUrl: string): string {
    if (/^https?:\/\//.test(relativeUrl)) return relativeUrl
    if (relativeUrl.startsWith('data:')) return relativeUrl
    const base = getApiBaseUrl()
    // base 形如 http://localhost:3000/api/v1，提取 origin
    const origin = base.match(/^(https?:\/\/[^/]+)/)?.[1] ?? ''
    return `${origin}${relativeUrl}`
  },
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('invalid-image'))
    }
    reader.onerror = () => reject(new Error('file-read-failed'))
    reader.readAsDataURL(file)
  })
}
