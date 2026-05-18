/**
 * Multifetch, adapted from "@ntlab/sfetch" by BellezaEmporium.
 * Multiple concurrent fetch with a callback to process the result of each request.
 * The maximum number of concurrent workers can be configured with `setMaxWorker()`.
 * By default, the callback will only be called if the request is successful and returns a result.
 * This behavior can be changed with `setCheckResult()`.
 * A custom debug function can be set with `setDebugger()`.
 * Native mock support via `setMocks()` for testing without axios.
 */

import axios, { AxiosRequestConfig } from 'axios'
import fs from 'fs'
import path from 'path'

interface QueueItem {
    url: string;
    method?: string;
    params?: Record<string, unknown>;
}

type QueueEntry = string | QueueItem;
type Callback = (queue: QueueEntry, data: unknown, headers?: unknown) => void;
type DebugFn = (format: string, url: string, config: string) => void;
type MockHandler = (url: string, config?: AxiosRequestConfig) => unknown;

interface MockRoute {
    handler: MockHandler | string;
    dataDir?: string;
}

let nworker = 25
let checkResult = true
let debug: DebugFn | undefined
const mocks = new Map<string, MockRoute>()

/**
 * Process a mock route and return response
 */
const processMockRoute = (url: string, config: AxiosRequestConfig | undefined, route: MockRoute): unknown => {
    const { handler, dataDir } = route
    
    if (typeof handler === 'function') {
        return handler(url, config)
    }
    
    if (typeof handler === 'string') {
        // If it looks like a file path, read from disk
        if (handler.includes('.') || handler.includes('/')) {
            const filePath = dataDir ? path.join(dataDir, handler) : handler
            const content = fs.readFileSync(filePath, 'utf8')
            if (handler.endsWith('.json')) {
                try {
                    return JSON.parse(content)
                } catch {
                    return content
                }
            }
            return content
        }
        // Otherwise return as-is
        return handler
    }
    
    return handler
}

/**
 * Check if a URL matches any mock pattern
 */
const findMock = (url: string): MockRoute | undefined => {
    // Try exact match first
    if (mocks.has(url)) return mocks.get(url)
    
    // Try pattern matching (prefix match)
    for (const [pattern, route] of mocks) {
        if (url.startsWith(pattern)) return route
    }
    return undefined
}

async function doFetch(queues: QueueEntry[], cb: Callback) {
    if (!queues.length) return

    let resolveFinish: (() => void) | undefined
    const workers = new Set<() => void>()
    let activeWorkers = 0

    const processQueue = () => {
        if (queues.length > 0 && activeWorkers < nworker) {
            const queue = queues.shift()
            if (queue === undefined) return
            
            activeWorkers++

            const processRequest = async () => {
                try {
                    const isQueueObject = typeof queue === 'object' && queue !== null
                    const url = isQueueObject ? queue.url : (queue as string)
                    const method = (isQueueObject && queue.method) ? queue.method : 'get'
                    const params = (isQueueObject && queue.params) ? queue.params : {}
                    
                    const requestConfig: AxiosRequestConfig = method === 'request'
                        ? { ...params, url }
                        : { ...params, url, method: method as AxiosRequestConfig['method'] }

                    if (debug) {
                        debug('fetch %s with %s', url, JSON.stringify(requestConfig))
                    }

                    // Check if there's a mock for this URL
                    const mock = findMock(url)
                    let response: unknown

                    if (mock) {
                        const mockResponse = processMockRoute(url, requestConfig, mock)
                        
                        const isObj = typeof mockResponse === 'object' && mockResponse !== null
                        if (debug) {
                            const hasData = isObj && 'data' in mockResponse
                            const keys = isObj ? Object.keys(mockResponse).join(',') : ''
                            debug(`mock response type: ${typeof mockResponse}, has data: ${hasData}, keys: ${keys}`, url, JSON.stringify(requestConfig))
                        }

                        // Check if response looks like it's already formatted (has 'data' and optionally 'status'/'headers')
                        const isFormatted = isObj && 'data' in mockResponse && 'status' in mockResponse
                        response = isFormatted ? mockResponse : { data: mockResponse, status: 200, headers: {} }
                    } else if (mocks.size > 0) {
                        // If mocks are set up but this URL doesn't match, return 404
                        response = { data: '', status: 404, headers: {} }
                    } else {
                        // No mocks set up, use real axios
                        const axMethod = (requestConfig.method || 'get').toLowerCase()
                        if (axMethod === 'get' && typeof axios.get === 'function') {
                            response = await axios.get(url, requestConfig)
                        } else if (axMethod === 'post' && typeof axios.post === 'function') {
                            response = await axios.post(url, requestConfig.data, requestConfig)
                        } else {
                            response = await axios.request(requestConfig)
                        }
                    }
                    
                    const res = response as { data?: unknown; headers?: unknown } | undefined
                    if ((checkResult && res?.data) || !checkResult) {
                        cb(queue, res?.data, res?.headers)
                    }
                } catch (err: unknown) {
                    const url = typeof queue === 'object' ? queue.url : queue
                    const errorMessage = err instanceof Error ? err.message : String(err)
                    console.error(`Unable to fetch ${url}: ${errorMessage}!`)
                    if (!checkResult) {
                        cb(queue, undefined)
                    }
                } finally {
                    activeWorkers--
                    workers.delete(processRequest)
                    processQueue()
                    
                    if (activeWorkers === 0 && queues.length === 0 && resolveFinish) {
                        resolveFinish()
                    }
                }
            }

            workers.add(processRequest)
            processRequest()
        }
    }

    // Start initial workers
    const initialWorkers = Math.min(nworker, queues.length)
    for (let i = 0; i < initialWorkers; i++) {
        processQueue()
    }

    // Wait for all to complete
    if (workers.size > 0 || activeWorkers > 0) {
        await new Promise<void>(resolve => {
            resolveFinish = resolve
        })
    }
}

Object.assign(doFetch, {
    getMaxWorker() {
        return nworker
    },
    setMaxWorker(n: number) {
        nworker = n
        return doFetch
    },
    getCheckResult() {
        return checkResult
    },
    setCheckResult(enabled: boolean) {
        checkResult = enabled
        return doFetch
    },
    setDebugger(dbg: (arg0: string, arg1: unknown, arg2: string) => void) {
        debug = dbg
        return doFetch
    },
    /**
     * Set mocks for URLs (for testing)
     * @param mockConfig - Object with URL patterns as keys and handlers as values
     * @param dataDir - Optional directory for resolving file paths in handlers
     * 
     * Usage:
     *   multifetch.setMocks({
     *     'https://example.com/api': (url) => ({ data: 'response' }),
     *     'https://example.com/file': 'response.json'
     *   }, __dirname)
     */
    setMocks(mockConfig: Record<string, MockHandler | string>, dataDir?: string) {
        mocks.clear()
        for (const [url, handler] of Object.entries(mockConfig)) {
            mocks.set(url, { handler, dataDir })
        }
        return doFetch
    },
    /**
     * Add a single mock route
     */
    addMock(url: string, handler: MockHandler | string, dataDir?: string) {
        mocks.set(url, { handler, dataDir })
        return doFetch
    },
    /**
     * Clear all mocks
     */
    clearMocks() {
        mocks.clear()
        return doFetch
    },
    /**
     * Get registered mock URLs for debugging
     */
    getMocks() {
        return Array.from(mocks.keys())
    }
})

export default doFetch
module.exports = doFetch