const axios = require('axios')

/**
 * A callback when fetch queue is completely done.
 *
 * To check for successful operation simply check if res is not undefined.
 *
 * @callback completeCallback
 * @param {string|object} queue Fetched queue which is complete
 * @param {string|object} res Response content returned by axios
 * @param {object} headers Response headers returned by axios
 */

/**
 * @type {number}
 */
let nworker = 25

/**
 * @type {boolean}
 */
let checkResult = true

/**
 * @type {any}
 */
let debug

/**
 * Queued url fetch.
 *
 * @param {array<string>} queues The queues
 * @param {completeCallback} cb Queue completion callback
 */
async function doFetch(queues, cb) {
  let n = Math.min(nworker, queues.length)
  const workers = []
  const adjustWorker = () => {
    if (queues.length > workers.length && workers.length < nworker) {
      let nw = Math.min(nworker, queues.length)
      if (n < nw) {
        n = nw
        createWorker()
      }
    }
  }
  const createWorker = () => {
    while (workers.length < n) {
      startWorker()
    }
  }
  const startWorker = () => {
    const worker = () => {
      if (queues.length) {
        const queue = queues.shift()
        const done = (res, headers) => {
          if ((checkResult && res) || !checkResult) {
            cb(queue, res, headers)
            adjustWorker()
          }
          worker()
        }
        const url = typeof queue === 'string' ? queue : queue.u
        const params = typeof queue === 'object' && queue.params ? queue.params : {}
        const method = typeof queue === 'object' && queue.m ? queue.m : 'get'
        if (typeof debug === 'function') {
          debug(`fetch %s with %s`, url, JSON.stringify(params))
        }
        axios[method](url, params)
          .then(response => {
            done(response.data, response.headers)
          })
          .catch(err => {
            console.error(`Unable to fetch ${url}: ${err.message}!`)
            done()
          })
      } else {
        workers.splice(workers.indexOf(worker), 1)
      }
    }
    workers.push(worker)
    worker()
  }
  createWorker()
  await new Promise(resolve => {
    const interval = setInterval(() => {
      if (workers.length === 0) {
        clearInterval(interval)
        resolve()
      }
    }, 500)
  })
}

module.exports = doFetch
Object.assign(module.exports, {
  setMaxWorker(n) {
    nworker = n
    return module.exports
  },
  setCheckResult(enabled) {
    checkResult = enabled
    return module.exports
  },
  setDebugger(dbg) {
    debug = dbg
    return module.exports
  }
})