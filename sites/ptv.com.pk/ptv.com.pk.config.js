// Disable TLS validation (use cautiously)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const customParseFormat = require('dayjs/plugin/customParseFormat');

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

function convertStringToDate(dateString) {
    const parsedDate = dayjs(dateString, 'YYYYMMDDHHmmss');
    const date = parsedDate.format('YYYY-MM-DD');
    return date;
}

function parseProgramTime(timeStr) {
  const timeZone = 'Asia/Karachi';

  if (timeStr.includes('am') || timeStr.includes('pm') || timeStr.includes('AM') || timeStr.includes('PM')) {
    return dayjs.tz(timeStr, 'hh.mm a', timeZone).format('YYYY-MM-DDTHH:mm:ssZ');
  } else if (timeStr.includes(':')) {
    return dayjs.tz(timeStr, 'h:mm A', timeZone).format('YYYY-MM-DDTHH:mm:ssZ');
  } else if (timeStr.length === 4) {
    return dayjs.tz(timeStr, 'HHmm', timeZone).format('YYYY-MM-DDTHH:mm:ssZ');
  } else if (timeStr.includes('PST') || timeStr.includes('UK') || timeStr.includes('USA')) {
    const times = timeStr.split(',').map(t => t.trim());
    return times.map(t => dayjs.tz(t, 'HHmmZZ', timeZone).format('YYYY-MM-DDTHH:mm:ssZ')).join(', ');
  } else {
    return 'Invalid time format';
  }
}

function calculateStopTime(start) {
  const timeZone = 'Asia/Karachi';
  return dayjs.tz(start, 'YYYY-MM-DDTHH:mm:ssZ', timeZone).add(1, 'hour').format('YYYY-MM-DDTHH:mm:ssZ');
}

function toProperCase(str) {
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

module.exports = {
  site: 'ptv.com.pk',
  channels: 'ptv.com.pk.channels.xml',
  days: 2,
  url: function ({ date, channel }) {
    const daysOfWeek = {
      0: 'Monday',
      1: 'Tuesday',
      2: 'Wednesday',
      3: 'Thursday',
      4: 'Friday',
      5: 'Saturday',
      6: 'Sunday'
    };
    const day = date.day();
    return `http://ptv.com.pk/getShowTvGuide?channel=${channel.site_id}&nameofday=${daysOfWeek[day]}`;
  },
  parser: function ({ content, date }) {
    let programs = [];
    
    try {
      const items = JSON.parse(content);
      items.forEach(item => {
        const start = parseProgramTime(item.programTime);
        const stop = calculateStopTime(start);
        programs.push({
          title: toProperCase(item.programName),
          description: item.descr || 'No description available',
          start,
          stop
        });
      });
    } catch (error) {
      console.error("Error parsing content:", error);
    }

    return programs;
  }
};
