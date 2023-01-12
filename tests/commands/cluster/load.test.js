const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync('tests/__data__/input/database/queue.db', 'tests/__data__/output/queue.db')
})

it('can load cluster and will terminate process if programs not found', () => {
  try {
    execSync(
      'DB_DIR=tests/__data__/output LOGS_DIR=tests/__data__/output/logs npm run cluster:load -- --cluster-id=1 --timeout=10000',
      { encoding: 'utf8' }
    )
    process.exit(1)
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout.includes('Error: No programs found')).toBe(true)
    expect(content('tests/__data__/output/logs/cluster/load/cluster_1.log')).toEqual(
      content('tests/__data__/expected/logs/cluster/load/cluster_1.log')
    )
  }
})

function content(filepath) {
  const data = fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })

  return data
    .split('\n')
    .filter(l => l)
    .map(l => {
      return JSON.parse(l)
    })
}
