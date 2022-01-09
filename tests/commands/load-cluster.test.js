const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.copyFileSync('tests/__data__/input/channels.db', 'tests/__data__/temp/channels.db')
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.mkdirSync('tests/__data__/temp')
})

it('can load cluster', () => {
  const result = execSync(
    'DB_DIR=tests/__data__/temp LOGS_PATH=tests/__data__/output/logs node scripts/commands/load-cluster.js --cluster-id=1',
    { encoding: 'utf8' }
  )
  const logs = fs.readFileSync(
    path.resolve('tests/__data__/output/logs/load-cluster/cluster_1.log'),
    {
      encoding: 'utf8'
    }
  )
  const lines = logs.split('\n')
  const parsed = JSON.parse(lines[0])
  expect(parsed._id).toBe('K1kaxwsWVjsRIZL6')
})
