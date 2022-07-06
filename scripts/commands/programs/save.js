const { db, logger, file, parser } = require('../../core')
const { Program, Channel } = require('epg-grabber')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

async function main() {
  await db.queue.load()
  await db.programs.load()
  await db.programs.reset()
  const files = await file.list(`${LOGS_DIR}/cluster/load/cluster_*.log`)
  for (const filepath of files) {
    logger.info(`Parsing "${filepath}"...`)
    const results = await parser.parseLogs(filepath)
    for (const result of results) {
      const queue = await db.queue.find({ _id: result._qid }).limit(1)
      if (!queue.length) continue
      const item = queue[0]
      const c = new Channel(item.channel)
      const programs = result.programs.map(p => {
        p = new Program(p, c)
        p._qid = result._qid

        return p
      })
      await db.programs.insert(programs)

      await db.queue.update({ _id: result._qid }, { $set: { error: result.error } })
    }
  }

  await db.queue.compact()
}

main()
