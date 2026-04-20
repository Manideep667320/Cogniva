import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')

console.log('--- PDF PARSE DEBUG ---')
console.log('Type of pdfParse:', typeof pdfParse)
console.log('Keys of pdfParse:', Object.keys(pdfParse || {}))
if (pdfParse && pdfParse.default) {
  console.log('Type of pdfParse.default:', typeof pdfParse.default)
}
console.log('-----------------------')
