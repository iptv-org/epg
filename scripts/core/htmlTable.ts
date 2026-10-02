import { HTMLTableColumn, HTMLTableDataItem, HTMLTableRow } from '../types/htmlTable'
import { Collection } from '@freearhey/core'
import { EOL } from '../constants'

export class HTMLTable {
  rows: Collection<HTMLTableRow>
  columns: Collection<HTMLTableColumn>

  constructor(rows: Collection<HTMLTableRow>, columns: Collection<HTMLTableColumn>) {
    this.rows = rows
    this.columns = columns
  }

  toString() {
    let output = `<table>${EOL}`

    output += `  <thead>${EOL}    <tr>`
    this.columns.forEach((column: HTMLTableColumn) => {
      const nowrap = column.nowrap ? ' nowrap' : ''
      const align = column.align ? ` align="${column.align}"` : ''
      const colspan = column.colspan ? ` colspan="${column.colspan}"` : ''

      output += `<th${align}${nowrap}${colspan}>${column.name}</th>`
    })
    output += `</tr>${EOL}  </thead>${EOL}`

    output += `  <tbody>${EOL}`
    this.rows.forEach((row: HTMLTableRow) => {
      output += '    <tr>'
      row.forEach((item: HTMLTableDataItem) => {
        const nowrap = item.nowrap ? ' nowrap' : ''
        const align = item.align ? ` align="${item.align}"` : ''
        const colspan = item.colspan ? ` colspan="${item.colspan}"` : ''

        output += `<td${align}${nowrap}${colspan}>${item.value}</td>`
      })
      output += `</tr>${EOL}`
    })
    output += `  </tbody>${EOL}`

    output += '</table>'

    return output
  }
}
