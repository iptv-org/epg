const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/temp/database', { recursive: true })
  fs.copyFileSync(
    'tests/__data__/input/database/channels.db',
    'tests/__data__/temp/database/channels.db'
  )

  execSync(
    'DB_DIR=tests/__data__/temp/database LOGS_DIR=tests/__data__/output/logs node scripts/commands/load-cluster.js --cluster-id=1',
    { encoding: 'utf8' }
  )
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
})

it('can load cluster', () => {
  const output = fs.readFileSync(
    path.resolve('tests/__data__/output/logs/load-cluster/cluster_1.log'),
    {
      encoding: 'utf8'
    }
  )
  const lines = output.split('\n')
  const parsed = JSON.parse(lines[0])

  expect(parsed._id).toBe('0Wefq0oMR3feCcuY')
})
