interface Column {
  name: string
  nowrap?: boolean
  align?: string
  colspan?: number
}

type DataItem = {
  value: string
  nowrap?: boolean
  align?: string
  colspan?: number
}[]

export class HTMLTable {
  data: DataItem[]
  columns: Column[]

  constructor(data: DataItem[], columns: Column[]) {
    this.data = data
    this.columns = columns
  }

  toString() {
    let output = '<table>\r\n'

    output += '  <thead>\r\n    <tr>'
    for (const column of this.columns) {
      const nowrap = column.nowrap ? ' nowrap' : ''
      const align = column.align ? ` align="${column.align}"` : ''
      const colspan = column.colspan ? ` colspan="${column.colspan}"` : ''

      output += `<th${align}${nowrap}${colspan}>${column.name}</th>`
    }
    output += '</tr>\r\n  </thead>\r\n'

    output += '  <tbody>\r\n'
    for (const row of this.data) {
      output += '    <tr>'
      for (const item of row) {
        const nowrap = item.nowrap ? ' nowrap' : ''
        const align = item.align ? ` align="${item.align}"` : ''
        const colspan = item.colspan ? ` colspan="${item.colspan}"` : ''

        output += `<td${align}${nowrap}${colspan}>${item.value}</td>`
      }
      output += '</tr>\r\n'
    }
    output += '  </tbody>\r\n'

    output += '</table>'

    return output
  }
}
