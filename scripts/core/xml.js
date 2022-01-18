const _ = require('lodash')
const dayjs = require('dayjs')
const utc = require('dayjs/plugin/utc')
dayjs.extend(utc)

const xml = {}

xml.create = function ({ channels, programs }) {
	let output = `<?xml version="1.0" encoding="UTF-8" ?><tv>\n`
	for (let channel of channels) {
		output += `<channel id="${escapeString(channel.xmltv_id)}">`
		output += `<display-name>${escapeString(channel.name)}</display-name>`
		if (channel.logo) output += `<icon src="${escapeString(channel.logo)}"/>`
		if (channel.site) output += `<url>https://${channel.site}</url>`
		output += `</channel>\n`
	}

	for (let program of programs) {
		if (!program) continue

		const start = program.start ? dayjs.unix(program.start).utc().format('YYYYMMDDHHmmss ZZ') : ''
		const stop = program.stop ? dayjs.unix(program.stop).utc().format('YYYYMMDDHHmmss ZZ') : ''

		if (start && stop) {
			output += `<programme start="${start}" stop="${stop}" channel="${escapeString(
				program.channel
			)}">`

			program.title.forEach(title => {
				output += `<title lang="${title.lang}">${escapeString(title.value)}</title>`
			})

			program.description.forEach(description => {
				output += `<desc lang="${description.lang}">${escapeString(description.value)}</desc>`
			})

			program.categories.forEach(category => {
				output += `<category lang="${category.lang}">${escapeString(category.value)}</category>`
			})

			if (program.season && program.episode) {
				const episodeNum = {
					xmltv_ns: createXMLTVNS(program.season, program.episode),
					onscreen: createOnScreen(program.season, program.episode)
				}

				for (const [system, value] of Object.entries(episodeNum)) {
					output += `<episode-num system="${system}">${value}</episode-num>`
				}
			}

			if (program.image) output += `<icon src="${escapeString(program.image)}"/>`

			output += '</programme>\n'
		}
	}

	output += '</tv>'

	return output
}

module.exports = xml

function escapeString(string, defaultValue = '') {
	if (!string) return defaultValue

	const regex = new RegExp(
		'((?:[\0-\x08\x0B\f\x0E-\x1F\uFFFD\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]))|([\\x7F-\\x84]|[\\x86-\\x9F]|[\\uFDD0-\\uFDEF]|(?:\\uD83F[\\uDFFE\\uDFFF])|(?:\\uD87F[\\uDF' +
			'FE\\uDFFF])|(?:\\uD8BF[\\uDFFE\\uDFFF])|(?:\\uD8FF[\\uDFFE\\uDFFF])|(?:\\uD93F[\\uDFFE\\uD' +
			'FFF])|(?:\\uD97F[\\uDFFE\\uDFFF])|(?:\\uD9BF[\\uDFFE\\uDFFF])|(?:\\uD9FF[\\uDFFE\\uDFFF])' +
			'|(?:\\uDA3F[\\uDFFE\\uDFFF])|(?:\\uDA7F[\\uDFFE\\uDFFF])|(?:\\uDABF[\\uDFFE\\uDFFF])|(?:\\' +
			'uDAFF[\\uDFFE\\uDFFF])|(?:\\uDB3F[\\uDFFE\\uDFFF])|(?:\\uDB7F[\\uDFFE\\uDFFF])|(?:\\uDBBF' +
			'[\\uDFFE\\uDFFF])|(?:\\uDBFF[\\uDFFE\\uDFFF])(?:[\\0-\\t\\x0B\\f\\x0E-\\u2027\\u202A-\\uD7FF\\' +
			'uE000-\\uFFFF]|[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]|[\\uD800-\\uDBFF](?![\\uDC00-\\uDFFF])|' +
			'(?:[^\\uD800-\\uDBFF]|^)[\\uDC00-\\uDFFF]))',
		'g'
	)

	string = String(string || '').replace(regex, '')

	return string
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/\n|\r/g, ' ')
		.replace(/  +/g, ' ')
		.trim()
}

function createXMLTVNS(s, e) {
	return `${s - 1}.${e - 1}.0/1`
}

function createOnScreen(s, e) {
	s = _.padStart(s, 2, '0')
	e = _.padStart(e, 2, '0')

	return `S${s}E${e}`
}
