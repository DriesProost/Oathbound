// Production policy lives here, independent of the provider interface.
// No automatic routing, escalation or alternative model exists.
export const runtimeAi = Object.freeze({model:'gpt-6-luna' as const,reasoning:'low' as const,timeoutMs:12000,maxCompletionTokens:3000});
