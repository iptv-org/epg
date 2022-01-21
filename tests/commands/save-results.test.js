const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

beforeEach(() => {
  fs.rmdirSync('tests/__data__/output', { recursive: true })
  fs.mkdirSync('tests/__data__/output')
  fs.mkdirSync('tests/__data__/output/database', { recursive: true })

  fs.copyFileSync(
    'tests/__data__/input/database/channels.db',
    'tests/__data__/output/database/channels.db'
  )

  const stdout = execSync(
    'DB_DIR=tests/__data__/output/database LOGS_DIR=tests/__data__/input/logs node scripts/commands/save-results.js',
    { encoding: 'utf8' }
  )
  console.log(stdout)
})

it('can save results', () => {
  const programs = content('tests/__data__/output/database/programs.db')

  expect(Object.keys(programs[0]).sort()).toEqual([
    '_cid',
    '_id',
    'category',
    'channel',
    'description',
    'episode',
    'icon',
    'lang',
    'season',
    'start',
    'stop',
    'title'
  ])

  expect(programs[0]).toMatchObject({
    _cid: '0Wefq0oMR3feCcuY'
  })

  const channels = content('tests/__data__/output/database/channels.db')

  expect(channels[1]).toMatchObject({
    _id: '0Wefq0oMR3feCcuY',
    logo: 'https://example.com/logo.png'
  })

  const errors = content('tests/__data__/input/logs/errors.log')

  expect(errors[0]).toMatchObject({
    _id: '00AluKCrCnfgrl8W',
    site: 'directv.com',
    xmltv_id: 'BravoEast.us',
    error: 'Invalid header value char'
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
