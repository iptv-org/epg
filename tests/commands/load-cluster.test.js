const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')

  execSync(
    'DB_DIR=tests/__data__/input/database LOGS_DIR=tests/__data__/output/logs node scripts/commands/load-cluster.js --cluster-id=1',
    { encoding: 'utf8' }
  )
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

  expect(parsed._id).toBe('K1kaxwsWVjsRIZL6')
})
