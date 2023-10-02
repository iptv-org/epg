import { execSync } from 'child_process'

type ExecError = {
  status: number
  stdout: string
}

describe('channels:validate', () => {
  it('will show a message if the file contains a duplicate', () => {
    try {
      const stdout = execSync(
        'DATA_DIR=tests/__data__/input/temp/data npm run channels:validate -- --channels=tests/__data__/input/channels-validate/duplicate.channels.xml',
        {
          encoding: 'utf8'
        }
      )
      console.log(stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect(
        (error as ExecError).stdout
          .includes(`tests/__data__/input/channels-validate/duplicate.channels.xml
┌─────────┬─────────────┬──────┬────────────────┬─────────┬─────────┐
│ (index) │    type     │ lang │    xmltv_id    │ site_id │  name   │
├─────────┼─────────────┼──────┼────────────────┼─────────┼─────────┤
│    0    │ 'duplicate' │ 'en' │ 'BravoEast.us' │  '140'  │ 'Bravo' │
└─────────┴─────────────┴──────┴────────────────┴─────────┴─────────┘
\n1 error(s) in 1 file(s)\n`)
      ).toBe(true)
    }
  })

  it('will show a message if the file contains a channel with wrong xmltv_id', () => {
    try {
      const stdout = execSync(
        'DATA_DIR=tests/__data__/input/temp/data npm run channels:validate -- --channels=tests/__data__/input/channels-validate/wrong_xmltv_id.channels.xml',
        {
          encoding: 'utf8'
        }
      )
      console.log(stdout)
      process.exit(1)
    } catch (error) {
      expect((error as ExecError).status).toBe(1)
      expect(
        (error as ExecError).stdout
          .includes(`tests/__data__/input/channels-validate/wrong_xmltv_id.channels.xml
┌─────────┬──────────────────┬──────┬────────────────────┬─────────┬─────────────────────┐
│ (index) │       type       │ lang │      xmltv_id      │ site_id │        name         │
├─────────┼──────────────────┼──────┼────────────────────┼─────────┼─────────────────────┤
│    0    │ 'wrong_xmltv_id' │ 'en' │ 'CNNInternational' │  '140'  │ 'CNN International' │
└─────────┴──────────────────┴──────┴────────────────────┴─────────┴─────────────────────┘
\n1 error(s) in 1 file(s)\n`)
      ).toBe(true)
    }
  })
})
