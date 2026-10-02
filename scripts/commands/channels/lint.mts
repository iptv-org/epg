import { XmlDocument, XsdValidator, XmlValidateError, ErrorDetail } from 'libxml2-wasm'
import { Storage, File } from '@freearhey/storage-js'
import { program } from 'commander'
import chalk from 'chalk'

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
      <xs:attribute use="required" ref="site"/>
      <xs:attribute use="required" ref="lang"/>
      <xs:attribute use="required" ref="site_id"/>
      <xs:attribute name="xmltv_id" use="required" type="xs:string"/>
      <xs:attribute name="logo" type="xs:string"/>
      <xs:attribute name="lcn" type="xs:string"/>
    </xs:complexType>
  </xs:element>
  <xs:attribute name="site">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:minLength value="1"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:attribute>
  <xs:attribute name="site_id">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:minLength value="1"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:attribute>
  <xs:attribute name="lang">
    <xs:simpleType>
      <xs:restriction base="xs:string">
        <xs:minLength value="1"/>
      </xs:restriction>
    </xs:simpleType>
  </xs:attribute>
</xs:schema>`

program.argument('[filepath...]', 'Path to *.channels.xml files to check').parse(process.argv)

async function main() {
  const storage = new Storage()

  let errors: ErrorDetail[] = []

  const files = program.args.length ? program.args : await storage.list('sites/**/*.channels.xml')
  for (const filepath of files) {
    const file = new File(filepath)
    if (file.extension() !== 'xml') continue

    const xml = await storage.load(filepath)

    let localErrors: ErrorDetail[] = []

    try {
      const schema = XmlDocument.fromString(xsd)
      const validator = XsdValidator.fromDoc(schema)
      const doc = XmlDocument.fromString(xml)

      validator.validate(doc)

      schema.dispose()
      validator.dispose()
      doc.dispose()
    } catch (_error) {
      const error = _error as XmlValidateError

      localErrors = localErrors.concat(error.details)
    }

    xml.split('\n').forEach((line: string, lineIndex: number) => {
      const found = line.match(/='/)
      if (found) {
        const colIndex = found.index || 0
        localErrors.push({
          line: lineIndex + 1,
          col: colIndex + 1,
          message: 'Single quotes cannot be used in attributes'
        })
      }
    })

    if (localErrors.length) {
      console.log(`\n${chalk.underline(filepath)}`)
      localErrors.forEach((error: ErrorDetail) => {
        const position = `${error.line}:${error.col}`
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
