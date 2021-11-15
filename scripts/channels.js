const { Command } = require('commander')
const fs = require('fs')
const path = require('path')
const { json2xml } = require('./utils')

const program = new Command()
program
  .requiredOption('-c, --config <config>', 'Config file')
  .option('-s, --set [args...]', 'Set custom arguments')
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
  channels = channels.map(channel => {
    if (!channel.xmltv_id) {
      channel.xmltv_id = channel.name
    }
    return channel
  })
  const xml = json2xml(channels, config.site)

  const dir = path.parse(options.config).dir
  const output = options.output || `${dir}/${config.site}.channels.xml`

  fs.writeFileSync(path.resolve(output), xml)

  console.log(`File '${output}' successfully saved`)
}

main()

function isPromise(promise) {
  return !!promise && typeof promise.then === 'function'
}
