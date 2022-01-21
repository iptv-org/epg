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
  fs.copyFileSync(
    'tests/__data__/input/database/channels.db',
    'tests/__data__/temp/database/channels.db'
  )

  execSync(
    'DB_DIR=tests/__data__/temp/database LOGS_DIR=tests/__data__/output/logs node scripts/commands/load-cluster.js --cluster-id=1 --timeout=10000',
    { encoding: 'utf8' }
  )
})

it('can load cluster', () => {
  const output = content('tests/__data__/output/logs/load-cluster/cluster_1.log')

  expect(Object.keys(output[0]).sort()).toEqual(['channel', 'date', 'error', 'programs'])

  expect(output[0]).toMatchObject({
    channel: {
      _id: '0Wefq0oMR3feCcuY',
      logo: 'https://example.com/logo.png'
    },
    date: dayjs.utc().startOf('d').format(),
    error: null
  })

  expect(output[1]).toMatchObject({
    channel: {
      _id: '1XzrxNkSF2AQNBrT',
      logo: 'https://www.magticom.ge/images/channels/MjAxOC8wOS8xMC9lZmJhNWU5Yy0yMmNiLTRkMTAtOWY5Ny01ODM0MzY0ZTg0MmEuanBn.jpg'
    }
  })
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
