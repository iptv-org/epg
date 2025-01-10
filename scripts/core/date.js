import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

const date = {}

date.getUTC = function (d = null) {
  if (typeof d === 'string') return dayjs.utc(d).startOf('d')

  return dayjs.utc().startOf('d')
}

export default date
