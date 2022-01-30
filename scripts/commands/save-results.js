const { db, logger, file, parser } = require('../core')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

async function main() {
  await db.queue.load()
  await db.programs.load()
  await db.programs.reset()
  const files = await file.list(`${LOGS_DIR}/load-cluster/cluster_*.log`)
  for (const filepath of files) {
    logger.info(`Parsing "${filepath}"...`)
    const results = await parser.parseLogs(filepath)
    for (const result of results) {
      const queue = await db.queue.find({ _id: result._qid }).limit(1)
      if (!queue.length) continue
      const item = queue[0]
      const programs = result.programs.map(program => {
        return {
          title: program.title,
          description: program.description || null,
          category: program.category || null,
          season: program.season || null,
          episode: program.episode || null,
          icon: program.icon || null,
          channel: item.xmltv_id,
          lang: program.lang,
          start: program.start,
          stop: program.stop,
          stop: program.stop,
          site: item.site,
          _qid: result._qid
        }
      })
      await db.programs.insert(programs)

      await db.queue.update({ _id: result._qid }, { $set: { error: result.error } })
    }
  }

  await db.queue.compact()
}

main()
