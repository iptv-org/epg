#! /usr/bin/env node

const { Command } = require('commander')
const grabber = require('epg-grabber')
const parser = require('./parser')
const file = require('./file')

const program = new Command()
program
  .requiredOption('--site <site>', 'Site domain')
  .option('--country <country>', 'Filter channels by country ISO code')
  .option('--language <language>', 'Filter channels by language ISO code')
  .option('--days <days>', 'Number of days for which to grab the program', parseInteger, 1)
  .option('--output <output>', 'Path to output file', 'guide.xml')
  .parse(process.argv)

async function main() {
  console.log('Starting...')
  console.time('Done in')

  const options = program.opts()

  const channelsPath = `sites/${options.site}.channels.xml`

  console.log(`Loading '${channelsPath}'...`)
  const channelsFile = file.read(channelsPath)
  let parsed = parser.parseChannels(channelsFile)
  let channels = parsed.groups.reduce((acc, curr) => {
    acc = acc.concat(curr.channels)
    return acc
  }, [])
  channels = filterChannels(channels, options)

  console.log('Parsing:')
  let programs = []
  for (let channel of channels) {
    const config = file.load(`sites/${channel.site}.config.js`)
    config.days = options.days
    await grabber
      .grab(channel, config, (item, err) => {
        const countryLabel = options.country ? ` (${options.country.toUpperCase()})` : ''
        console.log(
          `  ${item.channel.site}${countryLabel} - ${item.channel.xmltv_id} - ${item.date.format(
            'MMM D, YYYY'
          )} (${item.programs.length} programs)`
        )

        if (err) {
          console.log(`    Error: ${err.message}`)
        }
      })
      .then(results => {
        programs = programs.concat(results)
      })
      .catch(err => {
        console.log(`    Error: ${err.message}`)
      })
  }

  const xml = grabber.convertToXMLTV({ channels, programs })
  file.write(options.output, xml)

  console.log(`File '${options.output}' successfully saved`)
  console.timeEnd(`Done in`)

  return true
}

function filterChannels(channels, options) {
  return channels.filter(channel => {
    let result = true
    if (options.country) result = channel.country === options.country.toUpperCase()
    if (options.language) result = channel.lang === options.language
    return result
  })
}

function parseInteger(val) {
  return val ? parseInt(val) : null
}

main()
