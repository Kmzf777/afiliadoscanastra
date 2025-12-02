const rateLimitMap = new Map<string, { count: number; lastReset: number }>()

export default function rateLimit(options: { interval: number; uniqueTokenPerInterval?: number }) {
  return {
    check: (limit: number, token: string) =>
      new Promise<void>((resolve, reject) => {
        const now = Date.now()
        const windowStart = now - options.interval

        const tokenData = rateLimitMap.get(token) || { count: 0, lastReset: now }

        if (tokenData.lastReset < windowStart) {
          tokenData.count = 0
          tokenData.lastReset = now
        }

        tokenData.count += 1
        rateLimitMap.set(token, tokenData)

        if (tokenData.count > limit) {
          reject()
        } else {
          resolve()
        }
        
        // Cleanup (simple strategy: if map gets too big, clear it)
        if (rateLimitMap.size > (options.uniqueTokenPerInterval || 500)) {
            rateLimitMap.clear()
        }
      }),
  }
}
