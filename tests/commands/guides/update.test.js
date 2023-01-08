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
loading data/countries.json...
loading data/channels.json...
loading data/regions.json...
loading data/subdivisions.json...
loading database/programs.db...
found 5 programs
creating tests/__data__/output/guides/dk.xml...
creating tests/__data__/output/guides/dk.xml.gz...
creating tests/__data__/output/guides/dk.json...
creating tests/__data__/output/guides/uk.xml...
creating tests/__data__/output/guides/uk.xml.gz...
creating tests/__data__/output/guides/uk.json...
creating tests/__data__/output/guides/allente.se/da.xml...
creating tests/__data__/output/guides/allente.se/da.xml.gz...
creating tests/__data__/output/guides/allente.se/da.json...
creating tests/__data__/output/guides/virginmedia.com/en.xml...
creating tests/__data__/output/guides/virginmedia.com/en.xml.gz...
creating tests/__data__/output/guides/virginmedia.com/en.json...
creating tests/__data__/output/guides/sky.com/fr.xml...
creating tests/__data__/output/guides/sky.com/fr.xml.gz...
creating tests/__data__/output/guides/sky.com/fr.json...
creating tests/__data__/output/guides/sky.com/en.xml...
creating tests/__data__/output/guides/sky.com/en.xml.gz...
creating tests/__data__/output/guides/sky.com/en.json...
creating tests/__data__/output/logs/guides/update.log...

report:
┌─────────┬────────────┬───────────┬──────┬──────────┬────────────────┬───────────┐
│ (index) │    type    │   site    │ lang │ channel  │ broadcast_area │ languages │
├─────────┼────────────┼───────────┼──────┼──────────┼────────────────┼───────────┤
│    0    │ 'no_guide' │ 'sky.com' │ 'fr' │ 'CNN.us' │   [ 'c/US' ]   │ [ 'eng' ] │
└─────────┴────────────┴───────────┴──────┴──────────┴────────────────┴───────────┘
found 1 error(s)
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
