const dayjs = require('dayjs')

module.exports = {
  site: 'ctc.ru',
  days: 1,
  url: ({ date }) => `https://ctc.ru/api/page/v2/programm/?date=${formatDate(date)}`,
  parser({ content }) {
    const programs = []
    const items = parseItems(content)
    for (const item of items) {
      programs.push({
        title: item.bubbleTitle,
        // more like "films", "shows", "cartoons" - not a genre
        category: item.bubbleSubTitle,
        icons: parseIcons(item),
        images: parseImages(item),
        start: parseStart(item),
        stop: parseStop(item),
        // not sure if CTC uses this more like `premiere` but I don't have any
        // additional info to use in the `premiere` field so I'm using this
        // instead.
        new: item.isPremiere ?? false,
        url: item.bubbleUrl ? `https://ctc.ru${item.bubbleUrl}` : undefined,
        rating: parseRating(item),
      })
    }

    return programs
  }
}

function formatDate(date) {
  return dayjs(date).format('DD-MM-YYYY')
}

function parseIcons(item) {
  const images = item.bubbleImage ?? []
  // biggest first
  const sorted = images.sort((a, b) => b.height - a.height)

  return sorted.map((image) => ({
    src: image.url,
    width: image.width,
    height: image.height,
  }))
}

function parseImages(item) {
  const images = item.trackImageUrl ?? []
  // biggest first
  const sorted = images.sort((a, b) => b.height - a.height)

  // compile one image of each size since the content should be the same
  const sizes = {}
  for (const image of sorted) {
    const maxRes = Math.max(image.width, image.height)
    const item = {
      type: 'backdrop',
      // https://github.com/ektotv/xmltv/blob/801417b4b7aae38f13caa82d8bbfbed0a254ee5f/src/types.ts#L40-L48
      size: maxRes > 400 ? '3' : maxRes > 200 ? '2' : '1',
      orient: image.height > image.width ? 'P' : 'L',
      value: image.url,
    }
    if (sizes[item.size]) continue
    sizes[item.size] = item
  }

  // re-sort so the size 3 images are first
  return Object
    .values(sizes)
    .sort((a, b) => Number(b.size) - Number(a.size))
}

function parseStart(item) {
  return dayjs(item.startTime)
}

function parseStop(item) {
  return dayjs(item.endTime)
}

function parseRating(item) {
  if (item.ageLimit == null) return null
  return {
    // Not sure what the Russian system is actually called (if anything)
    system: 'Russia',
    value: `${item.ageLimit}+`,
  }
}

function parseItems(content) {
  const node = JSON.parse(content).content.find(n => n.type === 'tv-program')
  if (node) return node.widgets
  return []
}
