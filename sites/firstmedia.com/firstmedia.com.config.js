const dayjs = require("dayjs");
const timezone = require("dayjs/plugin/timezone");
const utc = require('dayjs/plugin/utc');

dayjs.extend(timezone);
dayjs.extend(utc);

module.exports = {
  site: "firstmedia.com",
  days: 1,
  request: {
    timeout: 30000 // 30 seconds
  },
  url: function ({ channel, date }) {
    return `https://www.firstmedia.com/ajax/schedule?date=${date.format("DD/MM/YYYY")
      }&channel=${channel.site_id}&start_time=1&end_time=24&need_channels=0`;
  },
  parser: function ({ content, channel }) {
    if (!content || !channel) return [];

    let programs = [];
    const items = parseItems(content, channel.site_id);
    items.forEach((item) => {
      programs.push({
        title: parseTitle(item),
        description: parseDescription(item),
        start: parseStart(item).toISOString(),
        stop: parseStop(item).toISOString(),
      });
    });

    return programs;
  },
};

function parseItems(content, channel) {
  return JSON.parse(content.trim()).entries[channel];
}

function parseTitle(item) {
  return item.title;
}

function parseDescription(item) {
  return item.long_description;
}

function parseStart(item) {
  return dayjs.tz(item.start_time, "YYYY-MM-DD HH:mm:ss", "Asia/Jakarta");
}

function parseStop(item) {
  return dayjs.tz(item.end_time, "YYYY-MM-DD HH:mm:ss", "Asia/Jakarta");
}
