const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
const timezone = require('dayjs/plugin/timezone')

dayjs.extend(utc)
dayjs.extend(timezone)

module.exports = {
  site: 'mic-indo.com',
  url() {
    return 'https://micindo.com/api/public/schedule'
  },
  parser(content) {
    try {
      let programs = []
      const json = JSON.parse(content)
      const jsonData = json.data
      jsonData.forEach(program => {
        programs.push({
          title: program.program,
          description: program.program_desc,
          start: dayjs.tz(program.start_time, 'Asia/Jakarta'),
          stop: dayjs.tz(program.end_time, 'Asia/Jakarta')
        })
      })
      return programs
    } catch {
      return []
    }
  }
}
