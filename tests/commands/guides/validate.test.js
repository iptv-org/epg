const { execSync } = require('child_process')
const fs = require('fs-extra')

beforeEach(() => {
  fs.emptyDirSync('tests/__data__/output')

  fs.copyFileSync(
    'tests/__data__/input/database/update-guides/programs.db',
    'tests/__data__/output/programs.db'
  )
})

it('will show a message if the channel is not in the guide', () => {
  const stdout = execSync(
    'DB_DIR=tests/__data__/output LOGS_DIR=tests/__data__/input/logs DATA_DIR=tests/__data__/input/data npm run guides:validate',
    {
      encoding: 'utf8'
    }
  )
  expect(stdout).toBe(
    `\n> guides:validate\n> node scripts/commands/guides/validate.js

loading data/channels.json...
loading tests/__data__/input/logs/guides/update.log...
loading database/programs.db...
found 4 programs
┌─────────┬────────────┬───────────────────┬──────┬──────────────┬────────────────┬───────────┐
│ (index) │    type    │       site        │ lang │   xmltv_id   │ broadcast_area │ languages │
├─────────┼────────────┼───────────────────┼──────┼──────────────┼────────────────┼───────────┤
│    0    │ 'no_guide' │ 'virginmedia.com' │ 'en' │ 'BBCNews.uk' │   [ 'c/UK' ]   │ [ 'eng' ] │
│    1    │ 'no_guide' │     'sky.com'     │ 'en' │ 'BBCNews.uk' │   [ 'c/UK' ]   │ [ 'eng' ] │
└─────────┴────────────┴───────────────────┴──────┴──────────────┴────────────────┴───────────┘

2 error(s)
`
  )
})
