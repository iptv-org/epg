const { db, logger, file, parser } = require('../core')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

async function main() {
  const errorsLog = `${LOGS_DIR}/errors.log`
  await file.create(errorsLog)
  await db.queue.load()
  await db.programs.load()
  await db.programs.reset()
  const files = await file.list(`${LOGS_DIR}/load-cluster/cluster_*.log`)
  for (const filepath of files) {
    logger.info(`Parsing "${filepath}"...`)
    const results = await parser.parseLogs(filepath)
    for (const result of results) {
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
          site: result.channel.site,
          _cid: result.channel._id
        }
      })
      await db.programs.insert(programs)

      await db.queue.update(
        { _id: result.channel._id },
        { $set: { programCount: result.programs.length } }
      )

      if (result.error) {
        await file.append(
          errorsLog,
          JSON.stringify({ ...result.channel, date: result.date, error: result.error }) + '\n'
        )
      }
    }
  }

  await db.queue.compact()
}

main()
