const { logger, file, xml, parser } = require('../../core')
const { Command } = require('commander')
const path = require('path')
const _ = require('lodash')

const program = new Command()
program
  .requiredOption('-c, --config <config>', 'Config file')
  .option('-s, --set [args...]', 'Set custom arguments', [])
  .option('-o, --output <output>', 'Output file')
  .option('--clean', 'Delete the previous *.channels.xml if exists')
  .parse(process.argv)

const options = program.opts()

async function main() {
  const config = require(path.resolve(options.config))
  const dir = file.dirname(options.config)
  const outputFilepath = options.output || `${dir}/${config.site}.channels.xml`

  let channels = []
  if (!options.clean && (await file.exists(outputFilepath))) {
    let result = await parser.parseChannels(outputFilepath)

    channels = result.channels
  }

  const args = {}
  options.set.forEach(arg => {
    const [key, value] = arg.split(':')
    args[key] = value
  })

  let parsedChannels = config.channels(args)
  if (isPromise(parsedChannels)) {
    parsedChannels = await parsedChannels
  }
  parsedChannels = parsedChannels.map(c => {
    c.lang = c.lang || 'en'

    return c
  })

  channels = channels.concat(parsedChannels)

  channels = _.uniqBy(channels, c => c.site_id + c.lang)

  channels = _.sortBy(channels, [
    'lang',
    c => (c.xmltv_id ? c.xmltv_id.toLowerCase() : '_'),
    'site_id'
  ])

  const output = xml.create(channels, config.site)

  await file.write(outputFilepath, output)

  logger.info(`File '${outputFilepath}' successfully saved`)
}

main()

function isPromise(promise) {
  return !!promise && typeof promise.then === 'function'
}
