#! /usr/bin/env node

const { Command } = require('commander')
const program = new Command()
const grabber = require('epg-grabber')
const path = require('path')
const fs = require('fs')
const convert = require('xml-js')

program
  .option('--channels <channels>', 'Path to channels.xml file')
  .option('--output <output>', 'Path to output file', 'guide.xml')
  .parse(process.argv)

const options = program.opts()

async function main() {
  console.log('Starting...')

  const buffer = {}
  const channels = parseChannels(options.channels).filter(channel => {
    if (!buffer[channel.xmltv_id]) {
      buffer[channel.xmltv_id] = true
      return true
    }
    return false
  })

  console.log('Parsing:')
  let programs = []
  for (let channel of channels) {
    const configPath = `sites/${channel.site}.config.js`
    const config = require(path.resolve(configPath))
    await grabber
      .grab(channel, config, (item, err) => {
        console.log(
          `  ${item.channel.xmltv_id} - ${item.channel.site} - ${item.date.format(
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
  }

  const xml = grabber.convertToXMLTV({ channels, programs })
  writeToFile(options.output, xml)

  console.log(`File '${options.output}' successfully saved`)
  console.log('Finish')

  return true
}

main()

function parseChannels(filename) {
  if (!filename) throw new Error('Path to [site].channels.xml is missing')
  console.log(`Loading '${filename}'...`)

  const xml = fs.readFileSync(path.resolve(filename), { encoding: 'utf-8' })
  const result = convert.xml2js(xml)
  const channels = result.elements.find(el => el.name === 'channels')

  return channels.elements
    .filter(el => el.name === 'channel')
    .map(el => {
      const channel = el.attributes
      if (!el.elements) throw new Error(`Channel '${channel.xmltv_id}' has no valid name`)
      channel.name = el.elements.find(el => el.type === 'text').text

      return channel
    })
}

function writeToFile(filename, data) {
  const dir = path.resolve(path.dirname(filename))
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(path.resolve(filename), data)
}
