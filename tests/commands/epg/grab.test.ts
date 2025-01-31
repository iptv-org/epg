import { execSync } from 'child_process'
import fs from 'fs-extra'
import { pathToFileURL } from 'node:url'
import path from 'path'
import os from 'os'
import { Zip } from '@freearhey/core'

let ENV_VAR =
  'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data'
if (os.platform() === 'win32') {
  ENV_VAR =
    'SET "SITES_DIR=tests/__data__/input/epg-grab/sites" && SET "CURR_DATE=2022-10-20" && SET "DATA_DIR=tests/__data__/input/temp/data" &&'
}

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('epg:grab', () => {
  it('can grab epg by site name', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide2.xml')
    )
  })

  it('can grab epg with multiple channels.xml files', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg-grab/sites/**/*.channels.xml --output=tests/__data__/output/guide.xml`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide.xml')
    )
  })

  it('can grab epg with gzip option enabled', async () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg-grab/sites/**/*.channels.xml --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}" --gzip`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide.xml')
    )

    const zip = new Zip()
    const expected = await zip.decompress(fs.readFileSync('tests/__data__/output/guide.xml.gz'))
    const result = await zip.decompress(fs.readFileSync('tests/__data__/expected/guide.xml.gz'))
    expect(expected).toEqual(result)
  }, 30000)

  it('can grab epg with wildcard as output', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg-grab/sites/example.com/example.com.channels.xml --output=tests/__data__/output/guides/{lang}/{site}.xml`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/en/example.com.xml')).toEqual(
      content('tests/__data__/expected/guides/en/example.com.xml')
    )

    expect(content('tests/__data__/output/guides/fr/example.com.xml')).toEqual(
      content('tests/__data__/expected/guides/fr/example.com.xml')
    )
  })

  it('can grab epg then language filter enabled', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg-grab/sites/example.com/example.com.channels.xml --output=tests/__data__/output/guides/{lang}/{site}.xml --lang=fr`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/fr/example.com.xml')).toEqual(
      content('tests/__data__/expected/guides/fr/example.com.xml')
    )
  })

  it('can grab epg using custom channels list', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg-grab/custom.channels.xml --output=tests/__data__/output/guide.xml`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/custom_guide.xml')
    )
  })

  it('it will raise an error if the timeout is exceeded', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg-grab/custom.channels.xml --output=tests/__data__/output/guide.xml --timeout=0`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(stdout).toContain('ERR: Connection timeout')
  })

  it('can grab epg via https proxy', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --proxy=https://bob:123456@proxy.com:1234 --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide2.xml')
    )
  })

  it('can grab epg via socks5 proxy', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --proxy=socks5://bob:123456@proxy.com:1234 --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide2.xml')
    )
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
