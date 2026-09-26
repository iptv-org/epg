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
  parser(context) {
    try {
      let programs = []
      const json = JSON.parse(context.content)
      const jsonData = json.data
      jsonData.forEach(programItem => {
        programs.push({
          title: programItem.program.program,
          description: programItem.program.program_desc,
          start: dayjs.tz(programItem.date + 'T' + programItem.start_time, 'Asia/Jakarta'),
          stop: dayjs.tz(programItem.date + 'T' + programItem.end_time, 'Asia/Jakarta')
        })
      })
      return programs
    } catch {
      return []
    }
  }
}
