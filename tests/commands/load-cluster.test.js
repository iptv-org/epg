const fs = require('fs')
const path = require('path')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const { execSync } = require('child_process')

dayjs.extend(utc)

beforeEach(() => {
  fs.rmdirSync('tests/__data__/temp', { recursive: true })
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/temp/database', { recursive: true })
  fs.copyFileSync('tests/__data__/input/database/queue.db', 'tests/__data__/temp/database/queue.db')

  execSync(
    'DB_DIR=tests/__data__/temp/database LOGS_DIR=tests/__data__/output/logs node scripts/commands/load-cluster.js --cluster-id=1 --timeout=10000',
    { encoding: 'utf8' }
  )
})

it('can load cluster', () => {
  let output = content('tests/__data__/output/logs/load-cluster/cluster_1.log')
  let expected = content('tests/__data__/expected/logs/load-cluster/cluster_1.log')

  output = output.map(i => {
    i.date = null
    return i
  })
  expected = expected.map(i => {
    i.date = null
    return i
  })

  expect(output).toEqual(expected)
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
