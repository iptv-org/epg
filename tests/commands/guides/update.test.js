const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/update-guides/programs.db',
    'tests/__data__/output/programs.db'
  )
})

it('can generate /guides', () => {
  const stdout = execSync(
    'DB_DIR=tests/__data__/output LOGS_DIR=tests/__data__/output/logs DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output CURR_DATE=2022-10-20 npm run guides:update',
    { encoding: 'utf8' }
  )

  expect(stdout).toBe(
    `
> guides:update
> NODE_OPTIONS=--max-old-space-size=5120 node scripts/commands/guides/update.js

starting...
loading data/channels.json...
loading database/programs.db...
found 6 programs
creating tests/__data__/output/guides/allente.se.xml...
creating tests/__data__/output/guides/allente.se.xml.gz...
creating tests/__data__/output/guides/allente.se.json...
creating tests/__data__/output/guides/virginmedia.com.xml...
creating tests/__data__/output/guides/virginmedia.com.xml.gz...
creating tests/__data__/output/guides/virginmedia.com.json...
creating tests/__data__/output/guides/sky.com.xml...
creating tests/__data__/output/guides/sky.com.xml.gz...
creating tests/__data__/output/guides/sky.com.json...
creating tests/__data__/output/logs/guides/update.log...
finished
`
  )

  const uncompressed = glob
    .sync('tests/__data__/expected/guides/*.xml')
    .map(f => f.replace('tests/__data__/expected/', ''))

  uncompressed.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  const compressed = glob
    .sync('tests/__data__/expected/guides/*.xml.gz')
    .map(f => f.replace('tests/__data__/expected/', ''))

  compressed.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  const json = glob
    .sync('tests/__data__/expected/guides/*.json')
    .map(f => f.replace('tests/__data__/expected/', ''))

  json.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  expect(content('output/logs/guides/update.log')).toEqual(
    content('expected/logs/guides/update.log')
  )
})

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
