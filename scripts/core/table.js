const table = {}

table.create = function (data, cols) {
  let output = '<table>\n'

  output += '  <thead>\n    <tr>'
  for (let column of cols) {
    output += `<th>${column}</th>`
  }
  output += '</tr>\n  </thead>\n'

  output += '  <tbody>\n'
  for (let groupId in data) {
    const group = data[groupId]
    for (let [i, item] of group.entries()) {
      const rowspan = group.length > 1 ? ` rowspan="${group.length}"` : ''
      output += '    <tr>'
      if (i === 0) {
        const name = item.flag ? `${item.flag}&nbsp;${item.name}` : item.name
        output += `<td valign="top"${rowspan}>${name}</td>`
      }
      output += `<td align="right">${item.channels}</td>`
      output += `<td nowrap>${item.epg}</td>`
      output += `<td>${item.status}</td>`
      output += '</tr>\n'
    }
  }
  output += '  </tbody>\n'

  output += '</table>'

  return output
}

module.exports = table
