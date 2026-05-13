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
    const cmd = `${ENV_VAR} npm run grab --- --sites=example.com --output="${path.resolve(
      'tests/__data__/output/guides/base.guide.xml'
    )}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/base.guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/base.guide.xml')
    )
  })

  it('can grab epg with curl option', () => {
    const cmd = `${ENV_VAR} npm run grab --- --sites=example.com --curl --output="${path.resolve(
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
      'tests/__data__/output/guides/guide.xml'
    )}" --gzip`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/gzip/guide.xml')
    )

    const outputString = pako.ungzip(fs.readFileSync('tests/__data__/output/guides/guide.xml.gz'), {
      to: 'string'
    })
    const expectedString = pako.ungzip(
      fs.readFileSync('tests/__data__/expected/epg_grab/gzip/guide.xml.gz'),
      { to: 'string' }
    )

    const output = new Set(normalizeContent(outputString).split('\r\n'))
    const expected = new Set(normalizeContent(expectedString).split('\r\n'))

    expect(output).toEqual(expected)
  })

  it('can grab epg with GZIP environment variable', () => {
    const cmd = `${ENV_VAR} GZIP=true npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example2.com/example2.com.channels.xml --output="${path.resolve(
      'tests/__data__/output/guides/guide.xml'
    )}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/gzip/guide.xml')
    )

    const outputString = pako.ungzip(fs.readFileSync('tests/__data__/output/guides/guide.xml.gz'), {
      to: 'string'
    })
    const expectedString = pako.ungzip(
      fs.readFileSync('tests/__data__/expected/epg_grab/gzip/guide.xml.gz'),
      { to: 'string' }
    )

    const output = new Set(outputString.split('\r\n'))
    const expected = new Set(expectedString.split('\r\n'))

    expect(output).toEqual(expected)
  })

  it('can grab epg with gzip path', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example2.com/example2.com.channels.xml --output="${path.resolve(
      'tests/__data__/output/guides/guide.xml'
    )}" --gzip="${path.resolve('tests/__data__/output/guides/custom.xml.gz')}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/gzip/guide.xml')
    )

    const outputString = pako.ungzip(
      fs.readFileSync('tests/__data__/output/guides/custom.xml.gz'),
      {
        to: 'string'
      }
    )
    const expectedString = pako.ungzip(
      fs.readFileSync('tests/__data__/expected/epg_grab/gzip/guide.xml.gz'),
      { to: 'string' }
    )

    const output = new Set(normalizeContent(outputString).split('\r\n'))
    const expected = new Set(normalizeContent(expectedString).split('\r\n'))

    expect(output).toEqual(expected)
  })

  it('can grab epg with json option enabled', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example2.com/example2.com.channels.xml --output="${path.resolve(
      'tests/__data__/output/guides/guide.xml'
    )}" --json`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/json/guide.xml')
    )

    expect(content('tests/__data__/output/guides/guide.json')).toEqual(
      content('tests/__data__/expected/epg_grab/json/guide.json')
    )
  })

  it('can grab epg with json path', () => {
    const cmd = `${ENV_VAR} npm run grab --- --channels=tests/__data__/input/epg_grab/sites/example2.com/example2.com.channels.xml --output="${path.relative(
      process.cwd(),
      'tests/__data__/output/guides/guide.xml'
    )}" --json="${path.relative(process.cwd(), 'tests/__data__/output/guides/custom.json')}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    expect(content('tests/__data__/output/guides/guide.xml')).toEqual(
      content('tests/__data__/expected/epg_grab/json/guide.xml')
    )

    expect(content('tests/__data__/output/guides/custom.json')).toEqual(
      content('tests/__data__/expected/epg_grab/json/guide.json')
    )
  })

  it('can fill schedule gaps with localized dummy programs', () => {
    const outputPath = path.resolve('tests/__data__/output/guides/fill_gaps.guide.xml')
    const cmd = `cross-env SITES_DIR=tests/__data__/input/fill_gaps/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/data npm run grab --- --sites=gapfill.com --fill-gaps --json --output="${outputPath}"`
    const stdout = execSync(cmd, { encoding: 'utf8' })
    if (process.env.DEBUG === 'true') console.log(cmd, stdout)

    const xml = fs.readFileSync(pathToFileURL(outputPath), 'utf8')
    const json = JSON.parse(
      fs.readFileSync(pathToFileURL('tests/__data__/output/guides/fill_gaps.json'), 'utf8')
    )

    const xmlProgrammeCount = (xml.match(/<programme /g) || []).length
    expect(xmlProgrammeCount).toBe(39)
    expect(json.programs).toHaveLength(39)

    const enPrograms = json.programs.filter((program: any) => program.channel === 'GapLong.us')
    expect(enPrograms).toHaveLength(8)
    expect(
      enPrograms
        .filter((program: any) => program.titles[0].value === 'Off Air')
        .map((program: any) => [program.start, program.stop])
    ).toEqual([
      [1666224000000, 1666238400000],
      [1666238400000, 1666240200000],
      [1666249800000, 1666252800000],
      [1666252800000, 1666267200000],
      [1666267200000, 1666281600000],
      [1666281600000, 1666296000000],
      [1666296000000, 1666310400000]
    ])

    const frPrograms = json.programs.filter((program: any) => program.channel === 'GapEmpty.fr')
    expect(frPrograms).toHaveLength(6)
    expect(frPrograms.every((program: any) => program.titles[0].value === 'Pause')).toBe(true)

    const itPrograms = json.programs.filter((program: any) => program.channel === 'GapMiddle.it')
    expect(itPrograms).toHaveLength(10)
    expect(
      itPrograms
        .filter((program: any) => program.titles[0].value === 'Pausa')
        .map((program: any) => [program.start, program.stop])
    ).toEqual([
      [1666224000000, 1666227600000],
      [1666231200000, 1666238400000],
      [1666238400000, 1666242000000],
      [1666245600000, 1666252800000],
      [1666252800000, 1666267200000],
      [1666267200000, 1666281600000],
      [1666281600000, 1666296000000],
      [1666296000000, 1666310400000]
    ])

    const dePrograms = json.programs.filter((program: any) => program.channel === 'GapOverlap.de')
    expect(dePrograms).toHaveLength(8)
    expect(
      dePrograms
        .filter((program: any) => program.titles[0].value === 'Sendepause')
        .map((program: any) => [program.start, program.stop])
    ).toEqual([
      [1666224000000, 1666227600000],
      [1666245600000, 1666252800000],
      [1666252800000, 1666267200000],
      [1666267200000, 1666281600000],
      [1666281600000, 1666296000000],
      [1666296000000, 1666310400000]
    ])

    const esPrograms = json.programs.filter((program: any) => program.channel === 'GapError.es')
    expect(esPrograms).toHaveLength(0)
    expect(stdout).toContain('ERR: Parser failure')

    const fallbackPrograms = json.programs.filter(
      (program: any) => program.channel === 'GapFallback.xx'
    )
    const fallbackDummies = fallbackPrograms.filter(
      (program: any) => program.titles[0].value === 'Off Air'
    )
    expect(fallbackPrograms).toHaveLength(7)
    expect(fallbackDummies).toHaveLength(6)
    expect(fallbackDummies.every((program: any) => program.titles[0].lang === 'xx')).toBe(true)

    const dummyPrograms = json.programs.filter((program: any) => {
      const title = program.titles[0].value
      return ['Off Air', 'Pause', 'Pausa', 'Sendepause'].includes(title)
    })
    expect(
      dummyPrograms.every((program: any) => program.stop - program.start <= 4 * 60 * 60 * 1000)
    ).toBe(true)
    expect(
      dummyPrograms.every(
        (program: any) => program.descriptions.length === 0 && program.categories.length === 0
      )
    ).toBe(true)

    expect(xml).toContain('<title lang="fr">Pause</title>')
    expect(xml).toContain('<title lang="de">Sendepause</title>')
    expect(xml).toContain('<title lang="xx">Off Air</title>')
  })
})

function content(filepath: string) {
  const string = fs.readFileSync(pathToFileURL(filepath), 'utf8')

  return new Set(normalizeContent(string).split('\r\n'))
}

function normalizeContent(content: string) {
  return content
    .replace(/<url>[^<]*<\/url>/g, '')
    .replace(/,"url":"[^"]*"/g, ',"url":null')
}
