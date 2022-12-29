const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const date = {}

date.getUTC = function (d = null) {
  if (typeof d === 'string') return dayjs.utc(d).startOf('d')

  return dayjs.utc().startOf('d')
}

module.exports = date
