const { Signale } = require('signale')

const options = {}

const logger = new Signale(options)

logger.config({
  displayLabel: false,
  displayScope: false,
  displayBadge: false
})

logger.memoryUsage = function () {
  const used = process.memoryUsage().heapUsed / 1024 / 1024

  logger.info(`memory: ${Math.round(used * 100) / 100} MB`)
}

module.exports = logger
