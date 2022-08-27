const { file, parser, logger } = require('../../core')
const { program } = require('commander')
const _ = require('lodash')

const CHANNELS_PATH = process.env.CHANNELS_PATH || 'sites/**/*.channels.xml'
const OUTPUT_DIR = process.env.OUTPUT_DIR || '.api'

async function main() {
  let guides = []

  const files = await file.list(CHANNELS_PATH).catch(console.error)
  for (const filepath of files) {
    try {
      const { site, channels } = await parser.parseChannels(filepath)
      const dir = file.dirname(filepath)
      const config = require(file.resolve(`${dir}/${site}.config.js`))
      if (config.ignore) continue

      const filename = file.basename(filepath)
      const [__, suffix] = filename.match(/\_(.*)\.channels\.xml$/) || [null, null]

      for (const channel of channels) {
        guides.push({
          channel: channel.id,
          site: channel.site,
          lang: channel.lang,
          url: `https://iptv-org.github.io/epg/guides/${suffix}/${site}.epg.xml.gz`
        })
      }
    } catch (err) {
      console.error(err)
      continue
    }
  }

  guides = _.sortBy(guides, 'channel')

  const outputFilepath = `${OUTPUT_DIR}/guides.json`
  await file.create(outputFilepath, JSON.stringify(guides))
  logger.info(`saved to "${outputFilepath}"...`)
}

main()
