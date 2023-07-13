const { api, parser, xml, file, logger } = require('../../core')
const { transliterate } = require('transliteration')
const nodeCleanup = require('node-cleanup')
const { program } = require('commander')
const inquirer = require('inquirer')

program
  .argument('<filepath>', 'Path to *.channels.xml file to edit')
  .option('-c, --country <name>', 'Source country', 'us')
  .parse(process.argv)

const filepath = program.args[0]
const options = program.opts()
const defaultCountry = options.country
const newLabel = ` [new]`

let site
let channels = []

async function main() {
  if (!(await file.exists(filepath))) {
    throw new Error(`File "${filepath}" does not exists`)
    return
  }

  let result = await parser.parseChannels(filepath)
  site = result.site
  channels = result.channels
  channels = channels.map(c => {
    c.xmltv_id = c.xmltv_id
    return c
  })
  await api.channels.load()
  const buffer = []
  for (const channel of channels) {
    if (channel.xmltv_id) {
      if (channel.xmltv_id !== '-') {
        buffer.push(`${channel.xmltv_id}/${channel.lang}`)
      }
      continue
    }
    let choices = await getOptions(channel)
    const question = {
      name: 'option',
      message: `Choose an option:`,
      type: 'list',
      choices,
      pageSize: 10
    }
    await inquirer.prompt(question).then(async selected => {
      switch (selected.option) {
        case 'Overwrite':
          const input = await getInput(channel)
          channel.xmltv_id = input.xmltv_id
          break
        case 'Skip':
          channel.xmltv_id = '-'
          break
        default:
          const [name, xmltv_id] = selected.option
            .replace(/ \[.*\]/, '')
            .split('|')
            .map(i => i.trim().replace(newLabel, ''))
          channel.xmltv_id = xmltv_id
          break
      }

      const found = buffer.includes(`${channel.xmltv_id}/${channel.lang}`)
      if (found) {
        const question = {
          name: 'option',
          message: `"${channel.xmltv_id}" already on the list. Choose an option:`,
          type: 'list',
          choices: ['Skip', 'Add', 'Delete'],
          pageSize: 5
        }
        await inquirer.prompt(question).then(async selected => {
          switch (selected.option) {
            case 'Skip':
              channel.xmltv_id = '-'
              break
            case 'Delete':
              channel.delete = true
              break
            default:
              break
          }
        })
      } else {
        if (channel.xmltv_id !== '-') {
          buffer.push(`${channel.xmltv_id}/${channel.lang}`)
        }
      }
    })
  }
}

main()

function save() {
  if (!file.existsSync(filepath)) return

  channels = channels.filter(c => !c.delete)

  const output = xml.create(channels, site)

  file.writeSync(filepath, output)

  logger.info(`\nFile '${filepath}' successfully saved`)
}

nodeCleanup(() => {
  save()
})

async function getInput(channel) {
  const name = channel.name.trim()
  const input = await inquirer.prompt([
    {
      name: 'xmltv_id',
      message: '  ID:',
      type: 'input',
      default: generateCode(name, defaultCountry)
    }
  ])

  return { name, xmltv_id: input['xmltv_id'] }
}

async function getOptions(channel) {
  const channels = await api.channels.all()
  const channelId = generateCode(channel.name, defaultCountry)
  const similar = await getSimilar(channels, channelId)
  let variants = []
  variants.push(`${channel.name.trim()} | ${channelId}${newLabel}`)
  similar.forEach(i => {
    let alt_names = i.alt_names.length ? ` (${i.alt_names.join(',')})` : ''
    let closed = i.closed ? `[closed:${i.closed}]` : ``
    let replaced_by = i.replaced_by ? `[replaced_by:${i.replaced_by}]` : ''
    variants.push(`${i.name}${alt_names} | ${i.id} ${closed}${replaced_by}[api]`)
  })
  variants.push(`Overwrite`)
  variants.push(`Skip`)

  return variants
}

async function getSimilar(list, channelId) {
  const normChannelId = channelId.split('.')[0].slice(0, 8).toLowerCase()
  return list.filter(i => i.id.split('.')[0].toLowerCase().startsWith(normChannelId))
}

function generateCode(name, country) {
  const id = transliterate(name)
    .replace(/\+/gi, 'Plus')
    .replace(/^\&/gi, 'And')
    .replace(/[^a-z\d]+/gi, '')

  return `${id}.${country}`
}
