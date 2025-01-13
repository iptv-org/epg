import chalk from 'chalk'
import libxml, { ValidationError } from 'libxmljs2'
import { program } from 'commander'
import { Storage, File } from '@freearhey/core'

const xsd = `<?xml version="1.0" encoding="UTF-8"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" elementFormDefault="qualified">
  <xs:element name="channels">
    <xs:complexType>
      <xs:sequence>
        <xs:element minOccurs="0" maxOccurs="unbounded" ref="channel"/>
      </xs:sequence>
    </xs:complexType>
  </xs:element>
  <xs:element name="channel">
    <xs:complexType mixed="true">
      <xs:attribute name="site" use="required" type="xs:string"/>
      <xs:attribute name="lang" use="required" type="xs:string"/>
      <xs:attribute name="site_id" use="required" type="xs:string"/>
      <xs:attribute name="xmltv_id" use="required" type="xs:string"/>
      <xs:attribute name="logo" type="xs:string"/>
    </xs:complexType>
  </xs:element>
</xs:schema>`

program.argument('[filepath]', 'Path to *.channels.xml files to check').parse(process.argv)

async function main() {
  const storage = new Storage()

  let errors: ValidationError[] = []

  const files = program.args.length ? program.args : await storage.list('sites/**/*.channels.xml')
  for (const filepath of files) {
    const file = new File(filepath)
    if (file.extension() !== 'xml') continue

    const xml = await storage.load(filepath)

    let localErrors: ValidationError[] = []

    try {
      const xsdDoc = libxml.parseXml(xsd)
      const doc = libxml.parseXml(xml)

      if (!doc.validate(xsdDoc)) {
        localErrors = doc.validationErrors
      }
    } catch (error) {
      localErrors.push(error)
    }

    if (localErrors.length) {
      console.log(`\n${chalk.underline(filepath)}`)
      localErrors.forEach((error: ValidationError) => {
        const position = `${error.line}:${error.column}`
        console.log(` ${chalk.gray(position.padEnd(4, ' '))} ${error.message.trim()}`)
      })

      errors = errors.concat(localErrors)
    }
  }

  if (errors.length) {
    console.log(chalk.red(`\n${errors.length} error(s)`))
    process.exit(1)
  }
}

main()
