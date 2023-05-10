import { HttpError } from './http.ts'

type ErrorResponse = {
  error: {
    code: string
    message: string
    type: string
  }
}

const ErrorMessages: Record<string, string> = {
  invalid_api_key: '无效的 API 密钥',
  invalid_organization: '无效的组织ID',
}

const ErrorCodes = [401, 429, 500]

export class OpenAIError extends Error {
  requestId: string | null

  model: string | null

  version:  string | null

  organization: string | null

  code: string

  statusCode: number

  isOpenAIError = true

  constructor(public error: ErrorResponse['error'], response: Response) {
    super(ErrorMessages[error.code] || error.message)

    this.error = error
    this.code = error.code
    this.requestId = response.headers.get('x-request-id')
    this.model = response.headers.get('openai-model')
    this.version = response.headers.get('openai-version')
    this.organization = response.headers.get('openai-organization')
    this.statusCode = response.status

    console.log(this.code)
  }

  toString() {
    const msg = this.message || "<empty message>"

    if (this.requestId) {
      return `Request ${this.requestId}: ${msg}`
    }

    return this.message
  }

  static isOpenAIError(err: unknown): err is OpenAIError {
    return (err as OpenAIError)?.isOpenAIError
  }
}

export async function enhanceErrorMessage(originException: unknown) {
  if (HttpError.isHttpError(originException)) {
    if (ErrorCodes.includes(originException.status) === false) return originException

    try {
      const resp: ErrorResponse = await originException.response.json()
      return new OpenAIError(
        resp.error,
        originException.response
      )
    } catch {
      // ignore
    }
  }

  return originException
}
