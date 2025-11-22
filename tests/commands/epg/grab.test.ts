import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'
import pako from 'pako'

const ENV_VAR =
  'cross-env SITES_DIR=tests/__data__/input/epg_grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/data'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('epg:grab', () => {
  it('can grab epg by site name', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --output="${path.resolve(
      'tests/__data__/output/guides/base.guide.xml'
    )}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/base.guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/base.guide.xml')
    )
  })

  it('can grab epg with curl option', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --curl --output="${path.resolve(
      'tests/__data__/output/guides/curl.guide.xml'
    )}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(stdout).toContain('curl https://example.com')
  })

  it('can grab epg with wildcard as output', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels="tests/__data__/input/epg_grab/sites/example.com/example.com.channels.xml" --output="tests/__data__/output/guides/wildcard/{site}/{lang}/guide.xml"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/wildcard/example.com/en/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/wildcard/example.com/en/guide.xml')
    )

    expect(content('tests/__data__/output/guides/wildcard/example.com/fr/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/wildcard/example.com/fr/guide.xml')
    )
  })

  it('can grab epg then language filter enabled', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example.com/example.com.channels.xml --output=tests/__data__/output/guides/lang/{lang}/guide.xml --lang=fr`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/lang/fr/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/lang/fr/guide.xml')
    )
  })

  it('can grab epg then using a multi-language filter', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example.com/example.com.channels.xml --output=tests/__data__/output/guides/multilang.guide.xml --lang=fr,it`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/multilang.guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/multilang.guide.xml')
    )
  })

  it('can grab epg using custom channels list', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/custom.channels.xml --output=tests/__data__/output/guides/custom_channels.guide.xml --days=2`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/custom_channels.guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/custom_channels.guide.xml')
    )
  })

  it('can grab epg with multiple channels.xml files', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/**/*.channels.xml --output=tests/__data__/output/guides/multiple_channels.guide.xml --days=2`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/multiple_channels.guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/multiple_channels.guide.xml')
    )
  })

  it('can grab epg with gzip option enabled', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example2.com/example2.com.channels.xml --output="${path.resolve(
      'tests/__data__/output/guides/gzip.guide.xml'
    )}" --gzip `
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/gzip.guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/gzip.guide.xml')
    )

    const outputString = pako.ungzip(
      fs.readFileSync('tests/__data__/output/guides/gzip.guide.xml.gz'),
      { to: 'string' }
    )
    const expectedString = pako.ungzip(
      fs.readFileSync('tests/__data__/expected/epg_grab/gzip.guide.xml.gz'),
      { to: 'string' }
    )

    const output = new Set(outputString.split('\r\n'))
    const expected = new Set(expectedString.split('\r\n'))

    expect(output).toEqual(expected)
  })
})

function content(filepath: string) {
  const string = fs.readFileSync(pathToFileURL(filepath), 'utf8')

  return new Set(string.split('\r\n'))
}
