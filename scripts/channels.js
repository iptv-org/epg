const { Command } = require('commander')
const fs = require('fs')
const path = require('path')
const { json2xml } = require('./utils')

const program = new Command()
program
  .requiredOption('-c, --config <config>', 'Config file')
  .option('-o, --output <output>', 'Output file')
  .parse(process.argv)

const options = program.opts()

async function main() {
  const config = require(path.resolve(options.config))
  let channels = config.channels()
  if (isPromise(channels)) {
    channels = await channels
  }
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
