const { db, logger, file, parser } = require('../core')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

async function main() {
  await db.channels.load()

  await db.programs.load()
  await db.programs.reset()
  const files = await file.list(`${LOGS_DIR}/load-cluster/cluster_*.log`)
  for (const filepath of files) {
    logger.info(`Parsing "${filepath}"...`)
    const results = await parser.parseLogs(filepath)
    for (const result of results) {
      await db.channels.update({ _id: result._id }, { $set: { logo: result.logo } })

      const programs = result.programs.map(program => {
        return {
          title: program.title,
          description: program.description || null,
          category: program.category || null,
          season: program.season || null,
          episode: program.episode || null,
          icon: program.icon || null,
          channel: program.channel,
          lang: program.lang,
          start: program.start,
          stop: program.stop,
          site: result.site,
          country: result.country,
          gid: result.gid
        }
      })

      await db.programs.insert(programs)
    }
  }

  await db.channels.compact()
}

main()
