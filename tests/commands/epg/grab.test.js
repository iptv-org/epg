const { execSync } = require('child_process')
const fs = require('fs-extra')
const path = require('path')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

it('can grab epg', () => {
  const stdout = execSync(
    'BASE_DIR=tests/__data__/input CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/tmp/data npm run grab -- --site=epg-grab --output=tests/__data__/output/{lang}/{site}.xml',
    { encoding: 'utf8' }
  )

  expect(content('tests/__data__/output/en/example.com.xml')).toEqual(
    content('tests/__data__/expected/guides/en/example.com.xml')
  )

  expect(content('tests/__data__/output/fr/example.com.xml')).toEqual(
    content('tests/__data__/expected/guides/fr/example.com.xml')
  )
})

it('can grab epg with language filter enabled', () => {
  const stdout = execSync(
    'BASE_DIR=tests/__data__/input CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/tmp/data npm run grab -- --site=epg-grab --lang=fr --output=tests/__data__/output/fr/guide.xml',
    { encoding: 'utf8' }
  )

  expect(content('tests/__data__/output/fr/guide.xml')).toEqual(
    content('tests/__data__/expected/guides/fr/example.com.xml')
  )
})

function content(filepath) {
  return fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })
}
