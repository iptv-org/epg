const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')
const glob = require('glob')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
  fs.copyFileSync(
    'tests/__data__/input/database/update-guides/queue.db',
    'tests/__data__/output/queue.db'
  )
})

it('can generate /guides', () => {
  fs.copyFileSync(
    'tests/__data__/input/database/update-guides/programs.db',
    'tests/__data__/output/programs.db'
  )
  const stdout = execSync(
    'DB_DIR=tests/__data__/output DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output CURR_DATE=2022-05-05 npm run guides:update',
    { encoding: 'utf8' }
  )

  const compressed = glob
    .sync('tests/__data__/expected/guides/**/*.epg.xml.gz')
    .map(f => f.replace('tests/__data__/expected/', ''))

  compressed.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })

  const json = glob
    .sync('tests/__data__/expected/guides/**/*.json')
    .map(f => f.replace('tests/__data__/expected/', ''))

  json.forEach(filepath => {
    expect(content(`output/${filepath}`), filepath).toBe(content(`expected/${filepath}`))
  })
})

it('will terminate process if programs not found', () => {
  fs.copyFileSync(
    'tests/__data__/input/database/update-guides/no-programs.db',
    'tests/__data__/output/programs.db'
  )
  try {
    const stdout = execSync(
      'DB_DIR=tests/__data__/output DATA_DIR=tests/__data__/input/data PUBLIC_DIR=tests/__data__/output npm run guides:update',
      { encoding: 'utf8' }
    )
    process.exit(1)
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout).toBe(`
> guides:update
> node scripts/commands/guides/update.js

Generating guides/...
Loading \"database/programs.db\"...
Loading queue...
Creating \"tests/__data__/output/guides/us/directv.com.epg.xml.gz\"...
Creating \"tests/__data__/output/guides/fr/chaines-tv.orange.fr.epg.xml.gz\"...
Creating \"tests/__data__/output/guides/bh/chaines-tv.orange.fr.epg.xml.gz\"...
Creating \"tests/__data__/output/guides/ge/magticom.ge.epg.xml.gz\"...
Creating \"tests/__data__/output/guides/ru/yandex.ru.epg.xml.gz\"...
Creating \"tests/__data__/output/guides/zw/dstv.com.epg.xml.gz\"...

Error: No programs found
`)
  }
})

function content(filepath) {
  return fs.readFileSync(`tests/__data__/${filepath}`, {
    encoding: 'utf8'
  })
}
