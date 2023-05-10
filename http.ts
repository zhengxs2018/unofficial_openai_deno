export class HttpError extends Error {
  status: number;

  isFetchError = true

  constructor(public request: Request, public response: Response, message?: string) {
    super(message || response.statusText);
    this.status = response.status
  }

  static isHttpError(err: unknown): err is HttpError {
    return (err as HttpError)?.isFetchError
  }
}

export class HttpHeaders extends Headers {
  copy() {
    return new HttpHeaders(this)
  }

  update(updated?: HeadersInit) {
    if (!updated) return this

    const headers = new Headers(updated)

    headers.forEach((value, name) => {
      this.set(name, value)
    })

    return this
  }
}

export type HttpClientConfig = Omit<RequestInit, 'body' | 'window' | 'signal'>

export class HttpClient {
  /**
   * Default configuration for requests.
   */
  defaults: Omit<HttpClientConfig, 'headers'> = {}

  /**
   * Default headers for requests.
   */
  headers: HttpHeaders = new HttpHeaders({
    'Content-Type': 'application/json'
  })

  constructor(public basePath: string, config?: HttpClientConfig) {
    const { headers, ...defaults } = config || {}

    this.defaults = defaults
    this.headers.update(headers)
  }

  async request(path: string, init?: RequestInit) {
    const { headers, ...args } = init || {}

    const request = new Request(this.toURL(path), {
      ...this.defaults,
      ...args,
      headers: this.headers.copy().update(headers),
    })

    const response = await fetch(request)

    if (this.validStatus(response.status) === false) {
      throw new HttpError(request, response)
    }

    return response
  }

  toURL(path: string) {
    return `${this.basePath}${path}`
  }

  validStatus(status: number) {
    return status >= 200 && status <= 299
  }
}
