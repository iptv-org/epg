const { logger, file, xml } = require('../../core')
const { Command } = require('commander')
const path = require('path')
const _ = require('lodash')

const program = new Command()
program
  .requiredOption('-c, --config <config>', 'Config file')
  .option('-s, --set [args...]', 'Set custom arguments', [])
  .option('-o, --output <output>', 'Output file')
  .parse(process.argv)

const options = program.opts()

async function main() {
  const config = require(path.resolve(options.config))
  const args = {}
  options.set.forEach(arg => {
    const [key, value] = arg.split(':')
    args[key] = value
  })

  let channels = config.channels(args)
  if (isPromise(channels)) {
    channels = await channels
  }
  channels = channels.map(c => {
    c.lang = c.lang || 'en'

    return c
  })
  channels = _.sortBy(channels, ['lang', 'xmltv_id'])

  const dir = file.dirname(options.config)
  const outputFilepath = options.output || `${dir}/${config.site}.channels.xml`

  const output = xml.create(channels, config.site)

  await file.write(outputFilepath, output)

  logger.info(`File '${outputFilepath}' successfully saved`)
}

main()

function isPromise(promise) {
  return !!promise && typeof promise.then === 'function'
}
