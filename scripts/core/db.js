const nedb = require('nedb-promises')
const file = require('./file')

const DB_DIR = process.env.DB_DIR || './scripts/database'

class Database {
  constructor(filepath) {
    this.filepath = filepath
    this.db = nedb.create({
      filename: file.resolve(filepath),
      autoload: true,
      onload: err => {
        if (err) console.error(err)
      },
      compareStrings: (a, b) => {
        a = a.replace(/\s/g, '_')
        b = b.replace(/\s/g, '_')

        return a.localeCompare(b, undefined, {
          sensitivity: 'accent',
          numeric: true
        })
      }
    })
  }

  removeIndex(field) {
    return this.db.removeIndex(field)
  }

  addIndex(options) {
    return this.db.ensureIndex(options)
  }

  compact() {
    return this.db.persistence.compactDatafile()
  }

  reset() {
    return file.clear(this.filepath)
  }

  count(query) {
    return this.db.count(query)
  }

  insert(doc) {
    return this.db.insert(doc)
  }

  update(query, update) {
    return this.db.update(query, update)
  }

  find(query) {
    return this.db.find(query)
  }

  remove(query, options) {
    return this.db.remove(query, options)
  }
}

const db = {}

db.channels = new Database(`${DB_DIR}/channels.db`)
db.programs = new Database(`${DB_DIR}/programs.db`)

module.exports = db
