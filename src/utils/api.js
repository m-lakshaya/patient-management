/**
 * Utility to wrap any promise with a timeout.
 * Useful for Supabase queries that might hang in certain network environments.
 */
export async function withTimeout(promise, timeoutMs = 5000, context = 'Query') {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${context} timed out after ${timeoutMs}ms`)), timeoutMs)
    )

    return Promise.race([promise, timeoutPromise])
}
