import assert from 'node:assert/strict'
import test from 'node:test'
import { containsAbusiveLanguage } from '../utils/abuseFilter.js'
import { toCsv } from '../utils/csv.js'

test('abusive comments are flagged without rejecting ordinary care feedback', () => {
  assert.equal(containsAbusiveLanguage('The care was thoughtful and kind.'), false)
  assert.equal(containsAbusiveLanguage('This was a shit experience.'), true)
})

test('CSV export quotes fields and neutralizes spreadsheet formulas', () => {
  const csv = toCsv(
    [{ comment: '=2+2', nurse: 'A "quoted" name' }],
    [
      { key: 'comment', label: 'Comment' },
      { key: 'nurse', label: 'Nurse' },
    ],
  )

  assert.equal(csv, '"Comment","Nurse"\r\n"\'=2+2","A ""quoted"" name"')
})
