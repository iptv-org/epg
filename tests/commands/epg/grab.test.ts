import { pathToFileURL } from 'node:url'
import { execSync } from 'child_process'
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import fs from 'fs-extra'
import path from 'path'
import pako from 'pako'

dayjs.extend(utc)
dayjs.extend(timezone)

const ENV_VAR =
  'cross-env SITES_DIR=tests/__data__/input/epg_grab/sites CURR_DATE=2022-10-20 DATA_DIR=tests/__data__/input/data'

interface GuideProgram {
  channel: string
  start: number
  stop: number
  titles: { value: string; lang: string }[]
  descriptions: unknown[]
  categories: unknown[]
}

interface GuideJson {
  programs: GuideProgram[]
}

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
    ) as GuideJson

    const xmlProgrammeCount = (xml.match(/<programme /g) || []).length
    expect(xmlProgrammeCount).toBe(47)
    expect(json.programs).toHaveLength(47)

    const enPrograms = json.programs.filter(
      (program: GuideProgram) => program.channel === 'GapLong.us'
    )
    expect(enPrograms).toHaveLength(8)
    expect(
      enPrograms
        .filter((program: GuideProgram) => program.titles[0].value === 'Off Air')
        .map((program: GuideProgram) => [program.start, program.stop])
    ).toEqual(
      rangesInTimezone(
        [
          ['2022-10-20T00:00:00', '2022-10-20T00:30:00'],
          ['2022-10-20T03:10:00', '2022-10-20T04:00:00'],
          ['2022-10-20T04:00:00', '2022-10-20T08:00:00'],
          ['2022-10-20T08:00:00', '2022-10-20T12:00:00'],
          ['2022-10-20T12:00:00', '2022-10-20T16:00:00'],
          ['2022-10-20T16:00:00', '2022-10-20T20:00:00'],
          ['2022-10-20T20:00:00', '2022-10-21T00:00:00']
        ],
        'America/New_York'
      )
    )

    const frPrograms = json.programs.filter(
      (program: GuideProgram) => program.channel === 'GapEmpty.fr'
    )
    expect(frPrograms).toHaveLength(6)
    expect(frPrograms.every((program: GuideProgram) => program.titles[0].value === 'Pause')).toBe(
      true
    )

    const itPrograms = json.programs.filter(
      (program: GuideProgram) => program.channel === 'GapMiddle.it'
    )
    expect(itPrograms).toHaveLength(8)
    expect(
      itPrograms
        .filter((program: GuideProgram) => program.titles[0].value === 'Pausa')
        .map((program: GuideProgram) => [program.start, program.stop])
    ).toEqual(
      rangesInTimezone(
        [
          ['2022-10-20T00:00:00', '2022-10-20T03:00:00'],
          ['2022-10-20T04:00:00', '2022-10-20T07:00:00'],
          ['2022-10-20T08:00:00', '2022-10-20T12:00:00'],
          ['2022-10-20T12:00:00', '2022-10-20T16:00:00'],
          ['2022-10-20T16:00:00', '2022-10-20T20:00:00'],
          ['2022-10-20T20:00:00', '2022-10-21T00:00:00']
        ],
        'Europe/Rome'
      )
    )

    const dePrograms = json.programs.filter(
      (program: GuideProgram) => program.channel === 'GapOverlap.de'
    )
    expect(dePrograms).toHaveLength(7)
    expect(
      dePrograms
        .filter((program: GuideProgram) => program.titles[0].value === 'Sendepause')
        .map((program: GuideProgram) => [program.start, program.stop])
    ).toEqual(
      rangesInTimezone(
        [
          ['2022-10-20T00:00:00', '2022-10-20T03:00:00'],
          ['2022-10-20T08:00:00', '2022-10-20T12:00:00'],
          ['2022-10-20T12:00:00', '2022-10-20T16:00:00'],
          ['2022-10-20T16:00:00', '2022-10-20T20:00:00'],
          ['2022-10-20T20:00:00', '2022-10-21T00:00:00']
        ],
        'Europe/Berlin'
      )
    )

    const esPrograms = json.programs.filter(
      (program: GuideProgram) => program.channel === 'GapError.es'
    )
    expect(esPrograms).toHaveLength(0)
    expect(stdout).toContain('ERR: Parser failure')

    const fallbackPrograms = json.programs.filter(
      (program: GuideProgram) => program.channel === 'GapFallback.xx'
    )
    const fallbackDummies = fallbackPrograms.filter(
      (program: GuideProgram) => program.titles[0].value === 'Off Air'
    )
    expect(fallbackPrograms).toHaveLength(7)
    expect(fallbackDummies).toHaveLength(6)
    expect(fallbackDummies.every((program: GuideProgram) => program.titles[0].lang === 'xx')).toBe(
      true
    )

    const boundaryPrograms = json.programs.filter(
      (program: GuideProgram) => program.channel === 'GapBoundary.de'
    )
    expect(boundaryPrograms).toHaveLength(11)
    expect(
      boundaryPrograms
        .filter((program: GuideProgram) => program.titles[0].value === 'Sendepause')
        .map((program: GuideProgram) => [program.start, program.stop])
    ).toEqual(
      rangesInTimezone(
        [
          ['2022-10-20T00:00:00', '2022-10-20T02:45:00'],
          ['2022-10-20T03:30:00', '2022-10-20T04:00:00'],
          ['2022-10-20T04:00:00', '2022-10-20T08:00:00'],
          ['2022-10-20T08:00:00', '2022-10-20T10:00:00'],
          ['2022-10-20T13:00:00', '2022-10-20T14:00:00'],
          ['2022-10-20T15:00:00', '2022-10-20T16:00:00'],
          ['2022-10-20T16:00:00', '2022-10-20T20:00:00'],
          ['2022-10-20T20:00:00', '2022-10-21T00:00:00']
        ],
        'Europe/Berlin'
      )
    )

    const dummyPrograms = json.programs.filter((program: GuideProgram) => {
      const title = program.titles[0].value
      return ['Off Air', 'Pause', 'Pausa', 'Sendepause'].includes(title)
    })
    expect(
      dummyPrograms.every(
        (program: GuideProgram) => program.stop - program.start <= 4 * 60 * 60 * 1000
      )
    ).toBe(true)
    expect(
      dummyPrograms.every(
        (program: GuideProgram) =>
          program.descriptions.length === 0 && program.categories.length === 0
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

function rangesInTimezone(ranges: string[][], timezoneName: string): number[][] {
  return ranges.map(([start, stop]) => [
    dayjs.tz(start, timezoneName).valueOf(),
    dayjs.tz(stop, timezoneName).valueOf()
  ])
}
