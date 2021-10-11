#! /usr/bin/env node

const { Command } = require('commander')
const program = new Command()
const grabber = require('epg-grabber')
const path = require('path')
const fs = require('fs')
const convert = require('xml-js')

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
  let channels = parseChannels(path.resolve(channelsPath))
  channels = filterChannels(channels, options)

  console.log('Parsing:')
  let programs = []
  for (let channel of channels) {
    const configPath = path.resolve(`sites/${channel.site}.config.js`)
    const config = require(configPath)
    config.days = options.days
    await grabber
      .grab(channel, config, (item, err) => {
        console.log(
          `  ${item.channel.site} - ${item.channel.xmltv_id} - ${item.date.format(
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
  writeToFile(options.output, xml)

  console.log(`File '${options.output}' successfully saved`)
  console.timeEnd(`Done in`)

  return true
}

main()

function filterChannels(channels, options) {
  return channels.filter(channel => {
    let result = true
    if (options.country) result = channel.country === options.country
    if (options.language) result = channel.lang === options.language
    return result
  })
}

function parseChannels(filename) {
  const xml = fs.readFileSync(path.resolve(filename), { encoding: 'utf-8' })
  const result = convert.xml2js(xml)
  const siteTag = result.elements.find(el => el.name === 'site')
  const channelsTags = siteTag.elements.filter(el => el.name === 'channels')

  let output = []

  channelsTags.forEach(channelsTag => {
    const channels = channelsTag.elements
      .filter(el => el.name === 'channel')
      .map(el => {
        const channel = el.attributes
        if (!el.elements) throw new Error(`Channel '${channel.xmltv_id}' has no valid name`)
        channel.name = el.elements.find(el => el.type === 'text').text
        channel.country = channelsTag.attributes.country
        channel.site = siteTag.attributes.site

        return channel
      })
    output = output.concat(channels)
  })

  return output
}

function writeToFile(filename, data) {
  const dir = path.resolve(path.dirname(filename))
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(path.resolve(filename), data)
}

function parseInteger(val) {
  return val ? parseInt(val) : null
}
