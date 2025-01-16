import { DATA_DIR } from '../../constants'
import { Storage, Collection, Logger } from '@freearhey/core'
import { ChannelsParser, XML, ApiChannel } from '../../core'
import { Channel } from 'epg-grabber'
import nodeCleanup from 'node-cleanup'
import { program } from 'commander'
import inquirer, { QuestionCollection } from 'inquirer'
import Fuse from 'fuse.js'
import readline from 'readline'

if (process.platform === 'win32') {
  readline
    .createInterface({
      input: process.stdin,
      output: process.stdout
    })
    .on('SIGINT', function () {
      process.emit('SIGINT')
    })
}

program.argument('<filepath>', 'Path to *.channels.xml file to edit').parse(process.argv)

const filepath = program.args[0]

const logger = new Logger()
const storage = new Storage()
let channels = new Collection()

async function main() {
  if (!(await storage.exists(filepath))) {
    throw new Error(`File "${filepath}" does not exists`)
  }

  const parser = new ChannelsParser({ storage })
  channels = await parser.parse(filepath)

  const dataStorage = new Storage(DATA_DIR)
  const channelsContent = await dataStorage.json('channels.json')
  const searchIndex = new Fuse(channelsContent, { keys: ['name', 'alt_names'], threshold: 0.4 })

  for (const channel of channels.all()) {
    if (channel.xmltv_id) continue
    const question: QuestionCollection = {
      name: 'option',
      message: `Select xmltv_id for "${channel.name}" (${channel.site_id}):`,
      type: 'list',
      choices: getOptions(searchIndex, channel),
      pageSize: 10
    }

    await inquirer.prompt(question).then(async selected => {
      switch (selected.option) {
        case 'Type...':
          const input = await getInput(channel)
          channel.xmltv_id = input.xmltv_id
          break
        case 'Skip':
          channel.xmltv_id = '-'
          break
        default:
          const [, xmltv_id] = selected.option
            .replace(/ \[.*\]/, '')
            .split('|')
            .map((i: string) => i.trim())
          channel.xmltv_id = xmltv_id
          break
      }
    })
  }

  channels.forEach((channel: Channel) => {
    if (channel.xmltv_id === '-') {
      channel.xmltv_id = ''
    }
  })
}

main()

function save() {
  if (!storage.existsSync(filepath)) return

  const xml = new XML(channels)

  storage.saveSync(filepath, xml.toString())

  logger.info(`\nFile '${filepath}' successfully saved`)
}

nodeCleanup(() => {
  save()
})

async function getInput(channel: Channel) {
  const name = channel.name.trim()
  const input = await inquirer.prompt([
    {
      name: 'xmltv_id',
      message: '  xmltv_id:',
      type: 'input'
    }
  ])

  return { name, xmltv_id: input['xmltv_id'] }
}

function getOptions(index, channel: Channel) {
  const similar = index.search(channel.name).map(result => new ApiChannel(result.item))

  const variants = new Collection()
  similar.forEach((_channel: ApiChannel) => {
    const altNames = _channel.altNames.notEmpty() ? ` (${_channel.altNames.join(',')})` : ''
    const closed = _channel.closed ? ` [closed:${_channel.closed}]` : ''
    const replacedBy = _channel.replacedBy ? `[replaced_by:${_channel.replacedBy}]` : ''

    variants.add(`${_channel.name}${altNames} | ${_channel.id}${closed}${replacedBy}`)
  })
  variants.add('Type...')
  variants.add('Skip')

  return variants.all()
}
