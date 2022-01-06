const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.copyFileSync('tests/__data__/input/test.db', 'tests/__data__/temp/test.db')
})

afterEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.mkdirSync('tests/__data__/temp')
})

it('can load cluster', () => {
  const result = execSync(
    'DB_FILEPATH=tests/__data__/temp/test.db LOGS_PATH=tests/__data__/output/logs node scripts/commands/load-cluster.js --cluster-id=1',
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
  expect(parsed['K1kaxwsWVjsRIZL6'][0]).toMatchObject({
    title: 'InfoNeu ',
    start: '2022-01-06T07:00:00.000Z',
    stop: '2022-01-06T08:00:00.000Z',
    channel: 'AndorraTV.ad',
    lang: 'ca'
  })
})
