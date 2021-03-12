#! /usr/bin/env node

const { Command } = require('commander')
const program = new Command()
const utils = require('./utils')

program
  .version('0.1.0', '-v, --version')
  .name('epg-grabber')
  .description('EPG grabber')
  .option('-c, --config <config>', 'Path to [site].config.js file')
  .parse(process.argv)

async function main() {
  console.log('\r\nStarting...')

  const options = program.opts()
  const config = utils.loadConfig(options.config)
  const client = utils.createHttpClient(config)
  const channels = utils.parseChannels(config.channels)
  const utcDate = utils.getUTCDate()
  const dates = Array.from({ length: config.days }, (_, i) => utcDate.add(i, 'd'))

  const queue = []
  channels.forEach(channel => {
    dates.forEach(date => {
      queue.push({ date, channel })
    })
  })

  let programs = []
  console.log('Parsing:')
  for (let item of queue) {
    const url = config.url(item)
    const progs = await client
      .get(url)
      .then(response => {
        const parserOptions = Object.assign({}, item, config, { content: response.data })
        const programs = config
          .parser(parserOptions)
          .filter(i => i)
          .map(p => {
            p.channel = item.channel.xmltv_id
            return p
          })

        console.log(
          `  ${item.channel.site} - ${item.channel.xmltv_id} - ${item.date.format(
            'MMM D, YYYY'
          )} (${programs.length} programs)`
        )

        return programs
      })
      .then(utils.sleep(config.delay))
      .catch(err => {
        console.log(
          `  ${item.channel.site} - ${item.channel.xmltv_id} - ${item.date.format(
            'MMM D, YYYY'
          )} (0 programs)`
        )
        console.log(`    Error: ${err.message}`)
      })

    programs = programs.concat(progs)
  }

  const xml = utils.convertToXMLTV({ config, channels, programs })
  const outputDir = utils.getDirectory(config.output)
  utils.createDir(outputDir)
  utils.writeToFile(config.output, xml)

  console.log(`File '${config.output}' successfully saved`)
  console.log('Finish')
}

main()
