const { db, logger, file, parser } = require('../core')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

async function main() {
  await db.programs.load()
  await db.programs.reset()
  const files = await file.list(`${LOGS_DIR}/load-cluster/cluster_*.log`)
  for (const filepath of files) {
    logger.info(`Parsing "${filepath}"...`)
    const results = await parser.parseLogs(filepath)
    for (const result of results) {
      const programs = result.programs.map(program => {
        program.site = result.site
        program.country = result.country
        program.gid = result.gid

        return program
      })

      await db.programs.insert(programs)
    }
  }
}

main()
