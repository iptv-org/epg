import { execSync } from 'child_process'
import fs from 'fs-extra'
import path from 'path'

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')
})

describe('epg:grab', () => {
  it('can grab epg by site name', () => {
    execSync(
      'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data npm run grab -- --site=example.com --output=tests/__data__/output/guide.xml',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide2.xml')
    )
  })

  it('can grab epg with multiple channels.xml files', () => {
    execSync(
      'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data npm run grab -- --channels=tests/__data__/input/epg-grab/sites/**/*.channels.xml --output=tests/__data__/output/guide.xml',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide.xml')
    )
  })

  it('can grab epg with gzip option enabled', () => {
    execSync(
      'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data npm run grab -- --channels=tests/__data__/input/epg-grab/sites/**/*.channels.xml --output=tests/__data__/output/guide.xml --gzip',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide.xml')
    )

    expect(content('tests/__data__/output/guide.xml.gz')).toEqual(
      content('tests/__data__/expected/guide.xml.gz')
    )
  })

  it('can grab epg with wildcard as output', () => {
    execSync(
      'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data npm run grab -- --channels=tests/__data__/input/epg-grab/sites/example.com/example.com.channels.xml --output=tests/__data__/output/guides/{lang}/{site}.xml',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/guides/en/example.com.xml')).toEqual(
      content('tests/__data__/expected/guides/en/example.com.xml')
    )

    expect(content('tests/__data__/output/guides/fr/example.com.xml')).toEqual(
      content('tests/__data__/expected/guides/fr/example.com.xml')
    )
  })

  it('can grab epg then language filter enabled', () => {
    execSync(
      'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data npm run grab -- --channels=tests/__data__/input/epg-grab/sites/example.com/example.com.channels.xml --output=tests/__data__/output/guides/{lang}/{site}.xml --lang=fr',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/guides/fr/example.com.xml')).toEqual(
      content('tests/__data__/expected/guides/fr/example.com.xml')
    )
  })

  it('can grab epg using custom channels list', () => {
    execSync(
      'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data npm run grab -- --channels=tests/__data__/input/epg-grab/custom.channels.xml --output=tests/__data__/output/guide.xml',
      { encoding: 'utf8' }
    )

    expect(content('tests/__data__/output/guide.xml')).toEqual(
      content('tests/__data__/expected/guide.xml')
    )
  })

  it('it will raise an error if the timeout is exceeded', () => {
    const stdout = execSync(
      'SITES_DIR=tests/__data__/input/epg-grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/temp/data npm run grab -- --channels=tests/__data__/input/epg-grab/custom.channels.xml --output=tests/__data__/output/guide.xml --timeout=0',
      { encoding: 'utf8' }
    )

    expect(stdout).toContain('ERR: Connection timeout')
  })
})

function content(filepath: string) {
  return fs.readFileSync(path.resolve(filepath), {
    encoding: 'utf8'
  })
}
