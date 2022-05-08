const { db, logger, file, parser } = require('../../core')
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
      const programs = result.programs.map(program => {
        return {
          title: program.title,
          description: program.description || null,
          category: program.category || null,
          season: program.season || null,
          episode: program.episode || null,
          url: program.url || null,
          icon: program.icon || null,
          channel: program.channel,
          sub_title: program.sub_title || null,
          date: program.date || null,
          lang: program.lang,
          start: program.start,
          stop: program.stop,
          director: program.director || null,
          actor: program.actor || null,
          writer: program.writer || null,
          adapter: program.adapter || null,
          producer: program.producer || null,
          composer: program.composer || null,
          editor: program.editor || null,
          presenter: program.presenter || null,
          commentator: program.commentator || null,
          guest: program.guest || null,
          site: item.channel.site,
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
