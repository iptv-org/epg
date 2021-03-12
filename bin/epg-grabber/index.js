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

const options = program.opts()

async function main() {
  console.log('\r\nStarting...')

  const config = utils.loadConfig(options.config)
  const client = utils.createHttpClient(config)
  const channels = utils.parseChannels(config.channels)

  const d = utils.getUTCDate()
  const dates = Array.from({ length: config.days }, (_, i) => d.add(i, 'd'))
  const queue = []
  channels.forEach(channel => {
    dates.forEach(date => {
      queue.push({
        url: config.url({ date, channel }),
        date,
        channel
      })
    })
  })

  console.log('Parsing:')
  let programs = []
  for (let item of queue) {
    const progs = await client
      .get(item.url)
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
      .catch(console.log)

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
