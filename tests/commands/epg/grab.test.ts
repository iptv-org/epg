import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import { Zip } from '@freearhey/core'
import fs from 'fs-extra'
import path from 'path'

const ENV_VAR =
  'cross-env SITES_DIR=tests/__data__/input/epg_grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/__data__'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('epg:grab', () => {
  it('can grab epg by site name', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}" --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/base.guide.xml')
    )
  })

  it('it will raise an error if the timeout is exceeded', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/custom.channels.xml --output=tests/__data__/output/guide.xml --timeout=0`
    let errorThrown = false
    try {
      execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
      // If no error is thrown, explicitly fail the test
      fail('Expected command to throw an error due to timeout, but it did not.')
    } catch (error) {
      errorThrown = true
      if (process.env.DEBUG === 'true') {
        const stderr = error.stderr?.toString() || ''
        const stdout = error.stdout?.toString() || ''
        const combined = stderr + stdout
        console.log('stdout:', stdout)
        console.log('stderr:', stderr)
        console.log('combined:', combined)
        console.log('exit code:', error.exitCode)
        console.log('Error output:', combined)
      }
    }
    expect(errorThrown).toBe(true)
  })

  it('can grab epg with wildcard as output', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels="tests/__data__/input/epg_grab/sites/example.com/example.com.channels.xml" --output="tests/__data__/output/guides/{lang}/{site}.xml" --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/en/example.com.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/guides/en/example.com.xml')
    )

    expect(content('tests/__data__/output/guides/fr/example.com.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/guides/fr/example.com.xml')
    )
  })

  it('can grab epg then language filter enabled', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example.com/example.com.channels.xml --output=tests/__data__/output/guides/{lang}/{site}.xml --lang=fr --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/fr/example.com.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/guides/fr/example.com.xml')
    )
  })

  it('can grab epg then using a multi-language filter', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/example.com/example.com.channels.xml --output=tests/__data__/output/guides/{site}.xml --lang=fr,it --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/example.com.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/lang.guide.xml')
    )
  })

  it('can grab epg via https proxy', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --proxy=https://bob:123456@proxy.com:1234 --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}" --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/proxy.guide.xml')
    )
  })

  it('can grab epg via socks5 proxy', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --proxy=socks5://bob:123456@proxy.com:1234 --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}" --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/proxy.guide.xml')
    )
  })

  it('can grab epg with curl option', () => {
    const cmd = `${ENV_VAR} npm run grab --- --site=example.com --curl --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}" --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(stdout).toContain('curl https://example.com')
  })

  it('can grab epg with multiple channels.xml files', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/**/*.channels.xml --output=tests/__data__/output/guide.xml --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/template.guide.xml')
    )
  })

  it('can grab epg using custom channels list', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/custom.channels.xml --output=tests/__data__/output/guide.xml  --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/custom_channels.guide.xml')
    )
  })

  it('can grab epg with gzip option enabled', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/**/*.channels.xml --output="${path.resolve(
      'tests/__data__/output/guide.xml'
    )}" --gzip  --timeout=100`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/template.guide.xml')
    )

    const zip = new Zip()
    const expected = zip.decompress(fs.readFileSync('tests/__data__/output/guide.xml.gz'))
    const result = zip.decompress(
      fs.readFileSync('tests/__data__/expected/epg_grab/template.guide.xml.gz')
    )
    expect(expected).toEqual(result)
  })
})

function content(filepath: string) {
  return fs.readFileSync(pathToFileURL(filepath), {
    encoding: 'utf8'
  })
}
