import { HttpClient } from './http.ts'
import { enhanceErrorMessage } from './error.ts'
import type {
  CreateModerationRequest,
  CreateModerationRequestInput, CreateModerationResponse, CreateEmbeddingRequestInput, CreateEmbeddingRequest, CreateEmbeddingResponse,
  CreateCompletionRequestPrompt, CreateCompletionRequest, CreateCompletionResponse,
  ChatCompletionRequestMessage,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse
} from './openai.ts'

import type {
  MaybeIsResponse,
  OpenAICreateCompletionRequest,
  OpenAICreateChatCompletionRequest
} from './types.ts'

const BASE_PATH = 'https://api.openai.com/v1'

export type Configuration = {
  /**
   * OpenAI API Base Path
   *
   * @defaultValue 'https://api.openai.com/v1'
   */
  basePath: string;

  /**
   * OpenAI API Key
   */
  apiKey: string;

  /**
   * OpenAI Organization ID
   */
  organization?: string;

  /**
   * Default headers for all requests
   */
  headers?: Record<string, string>;
}

export class OpenAIApi extends HttpClient {
  /**
   * OpenAI API Key
   */
  apiKey: string;

  /**
   * OpenAI Organization ID
   */
  organization?: string;

  constructor(params: Configuration) {
    super(params.basePath || BASE_PATH, {
      method: 'POST',
      headers: params.headers
    })

    this.apiKey = params.apiKey
    this.organization = params.organization

    this.headers.set('Authorization', `Bearer ${this.apiKey}`)

    if (this.organization) {
      this.headers.set('OpenAI-Organization', this.organization)
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
    this.headers.set('Authorization', `Bearer ${this.apiKey}`)
  }

  setOrganization(organization: string) {
    if (organization) {
      this.organization = organization
      this.headers.set('OpenAI-Organization', this.organization)
    } else {
      this.organization = undefined
      this.headers.delete('OpenAI-Organization')
    }
  }

  async request(path: string, init?: RequestInit) {
    try {
      return await super.request(path, init)
    } catch (error) {
      return Promise.reject(await enhanceErrorMessage(error))
    }
  }

  createModeration(input: CreateModerationRequestInput, init?: Omit<CreateModerationRequest, 'input'>): Promise<CreateModerationResponse> {
    const payload: CreateModerationRequest = { input, ...init }
    return this.request('/moderations', { body: JSON.stringify(payload) }).then(res => res.json())
  }

  createEmbedding(input: CreateEmbeddingRequestInput, init?: Omit<CreateEmbeddingRequest, 'input'>): Promise<CreateEmbeddingResponse> {
    const payload: CreateEmbeddingRequest = {
      model: 'text-embedding-ada-002',
      input,
      ...init,
    }
    return this.request('/embeddings', { body: JSON.stringify(payload) }).then(res => res.json())
  }

  createCompletion<T extends OpenAICreateCompletionRequest = OpenAICreateCompletionRequest>(prompt: CreateCompletionRequestPrompt, init?: T): Promise<MaybeIsResponse<T, CreateCompletionResponse>> {
    const payload: CreateCompletionRequest = { ...init, model: 'text-davinci-003', prompt }
    return this.request('/completions', { body: JSON.stringify(payload) }).then(res => {
      return init?.stream ? res : res.json()
    })
  }

  createChatCompletion<T extends OpenAICreateChatCompletionRequest = OpenAICreateChatCompletionRequest>(messages: ChatCompletionRequestMessage[], init?: T): Promise<MaybeIsResponse<T, CreateChatCompletionResponse>> {
    const payload: CreateChatCompletionRequest = { ...init, model: 'gpt-3.5-turbo', messages }
    return this.request('/chat/completions', { body: JSON.stringify(payload) }).then(res => {
      return init?.stream ? res : res.json()
    })
  }
}
