import type { CreateCompletionRequest , CreateChatCompletionRequest } from './openai.ts'

export type MaybeIsResponse<T, U> = T extends { stream: true } ? Response : U

export type OpenAICreateCompletionRequest = Partial<Omit<CreateCompletionRequest, 'prompt'>>

export type OpenAICreateChatCompletionRequest = Partial<Omit<CreateChatCompletionRequest, 'messages'>>
