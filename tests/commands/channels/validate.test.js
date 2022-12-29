const { execSync } = require('child_process')

it('will show a message if the file contains a duplicate', () => {
  try {
    const stdout = execSync(
      'DATA_DIR=tests/__data__/input/data npm run channels:validate -- tests/__data__/input/sites/duplicate.channels.xml',
      {
        encoding: 'utf8'
      }
    )
    console.log(stdout)
    process.exit(1)
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout).toBe(
      `\n> channels:validate\n> node scripts/commands/channels/validate.js\n\ntests/__data__/input/sites/duplicate.channels.xml
┌─────────┬─────────────┬──────┬─────────────────────────────┬─────────┬─────────────────────┐
│ (index) │    type     │ lang │          xmltv_id           │ site_id │        name         │
├─────────┼─────────────┼──────┼─────────────────────────────┼─────────┼─────────────────────┤
│    0    │ 'duplicate' │ 'en' │ 'CNNInternationalEurope.us' │  '140'  │ 'CNN International' │
└─────────┴─────────────┴──────┴─────────────────────────────┴─────────┴─────────────────────┘
\n1 error(s) in 1 file(s)\n`
    )
  }
})

it('will show a message if the file contains a channel with wrong xmltv_id', () => {
  try {
    const stdout = execSync(
      'DATA_DIR=tests/__data__/input/data npm run channels:validate -- tests/__data__/input/sites/wrong_xmltv_id.channels.xml',
      {
        encoding: 'utf8'
      }
    )
    console.log(stdout)
    process.exit(1)
  } catch (err) {
    expect(err.status).toBe(1)
    expect(err.stdout).toBe(
      `\n> channels:validate\n> node scripts/commands/channels/validate.js\n\ntests/__data__/input/sites/wrong_xmltv_id.channels.xml
┌─────────┬──────────────────┬──────┬────────────────────┬─────────┬─────────────────────┐
│ (index) │       type       │ lang │      xmltv_id      │ site_id │        name         │
├─────────┼──────────────────┼──────┼────────────────────┼─────────┼─────────────────────┤
│    0    │ 'wrong_xmltv_id' │ 'en' │ 'CNNInternational' │  '140'  │ 'CNN International' │
└─────────┴──────────────────┴──────┴────────────────────┴─────────┴─────────────────────┘
\n1 error(s) in 1 file(s)\n`
    )
  }
})
