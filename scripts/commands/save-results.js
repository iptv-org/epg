const { db, logger, file, parser } = require('../core')
const _ = require('lodash')

const LOGS_DIR = process.env.LOGS_DIR || 'scripts/logs'

async function main() {
  const files = await file.list(`${LOGS_DIR}/load-cluster/cluster_*.log`)
  for (const filepath of files) {
    const results = await parser.parseLogs(filepath)
    results.forEach(result => {
      const programs = result.programs.map(p => {
        p.site = result.site
        return p
      })
      db.programs.insert(programs)
    })
  }
  db.programs.compact()
}

main()
