import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { after, test } from 'node:test'
import sharp from 'sharp'
import { allocateId, formMaps, slugifyTitle } from './forms-mapping.ts'
import { importForms, loadEnvFile, parseArgs, publishedCsvUrl, questionKey } from './import-forms.ts'
import { repoRoot } from './lib/root.ts'
import { alumnusSchema, eventSchema, newsSchema, openingSchema, projectSchema } from './lib/schema.ts'

const schemas = {
  'data/news.csv': newsSchema,
  'data/projects.csv': projectSchema,
  'data/events.csv': eventSchema,
  'data/openings.csv': openingSchema,
  'data/people/alumni.csv': alumnusSchema,
} as const

const fixtureRoot = path.join(repoRoot, 'scripts/__fixtures__')
const baseline = path.join(fixtureRoot, 'baseline')
const sheet = path.join(fixtureRoot, 'sheet')
const expectedRoot = path.join(fixtureRoot, 'expected')
const today = '2026-10-24'
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'sit-forms-'))

after(() => {
  fs.rmSync(temp, { recursive: true, force: true })
})

test('slug of a long title is cut on a word boundary', () => {
  assert.equal(
    slugifyTitle('SIT launches annual Research-to-Impact Collaboration (RIC) workshops'),
    'sit-launches-annual-research-to-impact-collaboration-ric',
  )
  assert.equal(allocateId('keep-me', new Set(['keep-me'])), 'keep-me-2')
  assert.equal(allocateId('keep-me', new Set(['keep-me', 'keep-me-2'])), 'keep-me-3')
})

test('every stored column exists on the zod schema', () => {
  assert.equal(formMaps.length, 5)
  for (const form of formMaps) {
    const schema = schemas[form.csv as keyof typeof schemas]
    assert.ok(schema, form.csv)
    for (const column of form.columns) {
      if (!column.store) continue
      assert.ok(column.column in schema.shape, `${form.csv} column ${column.column}`)
    }
  }
  const news = formMaps.find((form) => form.tab === 'news')
  const projects = formMaps.find((form) => form.tab === 'projects')
  const openings = formMaps.find((form) => form.tab === 'openings')
  const alumni = formMaps.find((form) => form.tab === 'alumni')
  assert.equal(news?.columns.find((column) => column.column === 'category')?.choices?.get('Media coverage'), 'media')
  assert.equal(news?.columns.find((column) => column.column === 'image_alt')?.store, true)
  assert.equal(projects?.moderationColumn, 'moderation')
  assert.equal(projects?.columns.some((column) => column.column === 'update_of' && column.store), false)
  assert.equal(openings?.columns.find((column) => column.column === 'type')?.choices?.get('Call for proposals'), 'call')
  assert.equal(alumni?.columns.find((column) => column.column === 'consent')?.store, false)
  assert.equal(
    projects?.columns.find((column) => column.column === 'seeking')?.choices?.get('Pre-doc (Research Fellow)'),
    'Predoc',
  )
  assert.equal(
    projects?.columns.find((column) => column.column === 'stage')?.choices?.get('Initiative (several co-owners, products/platforms, external funding)'),
    'initiative',
  )
  assert.equal(projects?.columns.find((column) => column.column === 'stage')?.choices?.get('Initiative'), 'initiative')
  assert.equal(projects?.columns.find((column) => column.column === 'initiative')?.choices?.get('CoRE stack'), 'core-stack')
  assert.equal(projects?.columns.find((column) => column.column === 'initiative')?.choices?.get('Cybersecurity'), 'cybersecurity')
  assert.equal(openings?.columns.some((column) => column.column === 'contact'), false)
})

test('parseArgs reads the fallback flags', () => {
  const options = parseArgs(['--dry-run', '--from-dir', 'data/incoming', '--today', today], repoRoot)
  assert.equal(options.dryRun, true)
  assert.equal(options.today, today)
  assert.equal(options.fromDir, path.join(repoRoot, 'data/incoming'))
})

test('a published web-page link becomes the CSV of the same sheet', () => {
  const page = 'https://docs.google.com/spreadsheets/d/e/2PACX-example/pubhtml?gid=2081786903&single=true'
  assert.equal(
    publishedCsvUrl(page),
    'https://docs.google.com/spreadsheets/d/e/2PACX-example/pub?gid=2081786903&single=true&output=csv',
  )
  assert.equal(questionKey('One-paragraph summary (shown on cards)'), 'one-paragraph summary')
})

test('loadEnvFile fills empty variables and leaves existing ones', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sit-env-'))
  const file = path.join(dir, '.env')
  fs.writeFileSync(file, '# comment\nSUBMISSIONS_SHEET_ID="sheet-from-file"\nGOOGLE_SERVICE_ACCOUNT_JSON=from-file\n')
  const previousSheet = process.env.SUBMISSIONS_SHEET_ID
  const previousJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  delete process.env.SUBMISSIONS_SHEET_ID
  process.env.GOOGLE_SERVICE_ACCOUNT_JSON = 'keep-me'
  try {
    loadEnvFile(file)
    assert.equal(process.env.SUBMISSIONS_SHEET_ID, 'sheet-from-file')
    assert.equal(process.env.GOOGLE_SERVICE_ACCOUNT_JSON, 'keep-me')
  } finally {
    if (previousSheet === undefined) delete process.env.SUBMISSIONS_SHEET_ID
    else process.env.SUBMISSIONS_SHEET_ID = previousSheet
    if (previousJson === undefined) delete process.env.GOOGLE_SERVICE_ACCOUNT_JSON
    else process.env.GOOGLE_SERVICE_ACCOUNT_JSON = previousJson
    fs.rmSync(dir, { recursive: true, force: true })
  }
})

test('a shorter question title still maps onto the news columns', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sit-short-'))
  const incoming = path.join(root, 'incoming')
  fs.mkdirSync(path.join(root, 'data'), { recursive: true })
  fs.mkdirSync(incoming, { recursive: true })
  fs.writeFileSync(
    path.join(root, 'data/news.csv'),
    'id,date,category,title,summary,body_md,link,image,thrust_area,featured,status,submitted_by\n',
  )
  fs.writeFileSync(
    path.join(incoming, 'news.csv'),
    [
      'Headline,Date of the news,Category,One-paragraph summary,Full text,Link for more information,status',
      'Short header works,2026-10-25,Announcement,A summary.,More text,https://example.com/n,published',
    ].join('\n'),
  )
  try {
    const result = await importForms({ root, fromDir: incoming, today: '2026-10-25' })
    assert.deepEqual(result.errors, [])
    const written = fs.readFileSync(path.join(root, 'data/news.csv'), 'utf8')
    assert.match(written, /short-header-works/)
    assert.match(written, /A summary\./)
    assert.match(written, /More text/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('fixture sheet import matches the expected CSVs and a second run is a no-op', async () => {
  const repoNews = fs.readFileSync(path.join(repoRoot, 'data/news.csv'))
  fs.cpSync(baseline, temp, { recursive: true })
  const options = { root: temp, fromDir: sheet, today }

  const dry = await importForms({ ...options, dryRun: true })
  assert.deepEqual(dry.errors, [])
  assert.equal(dry.changed, true)
  assert.equal(fs.existsSync(path.join(temp, 'assets')), false)
  assert.equal(fs.readFileSync(path.join(temp, 'data/news.csv')).equals(fs.readFileSync(path.join(baseline, 'data/news.csv'))), true)

  const result = await importForms(options)
  assert.deepEqual(result.errors, [])
  assert.deepEqual(result.warnings, ['alumni row 4: skipped Quiet Person, no consent'])
  assert.equal(dry.changes.find((change) => change.file === 'data/news.csv')?.after, fs.readFileSync(path.join(temp, 'data/news.csv'), 'utf8'))
  assert.equal(result.changed, true)
  assert.equal(result.inserted, 5)
  assert.equal(result.deleted, 0)

  const files = ['data/news.csv', 'data/projects.csv', 'data/events.csv', 'data/openings.csv', 'data/people/alumni.csv']
  for (const file of files) {
    const actual = fs.readFileSync(path.join(temp, file), 'utf8')
    const expectedPath = path.join(expectedRoot, file)
    if (process.env.UPDATE_FIXTURES === '1') {
      fs.mkdirSync(path.dirname(expectedPath), { recursive: true })
      fs.writeFileSync(expectedPath, actual)
    }
    assert.equal(actual, fs.readFileSync(expectedPath, 'utf8'), file)
  }

  const news = fs.readFileSync(path.join(temp, 'data/news.csv'), 'utf8')
  assert.match(news, /sit-launches-annual-research-to-impact-collaboration-ric/)
  assert.match(news, /Corrected summary for the workshop/)
  assert.doesNotMatch(news, /Original summary that should not win/)
  assert.doesNotMatch(news, /Ignore this pending note/)
  assert.match(news, /old-talk,2020-05-01,event,Old talk,.*draft/)
  assert.match(news, /2026-10-24/)
  assert.match(news, /sustainability-and-social-development;health-and-social-care-technologies/)
  assert.match(news, /Aaditeshwar Seth;Chahat Bansal/)

  const projects = fs.readFileSync(path.join(temp, 'data/projects.csv'), 'utf8')
  assert.match(projects, /canal-silt-calculator/)
  assert.match(projects, /village-water,Village water study/)
  assert.match(projects, /core-stack/)
  assert.match(projects, /2026-10-24/)
  assert.match(projects, /PhD;Funding/)
  assert.match(projects, /MSR;Predoc/)
  assert.match(projects, /retire-me,Retire me,.*FALSE,FALSE,2026-10-24/)
  assert.doesNotMatch(projects, /Pending project/)

  const openings = fs.readFileSync(path.join(temp, 'data/openings.csv'), 'utf8')
  assert.match(openings, /research-fellow-call,Research fellow call,call/)
  assert.match(openings, /,open\n/)
  assert.doesNotMatch(openings, /Secret rejected role/)

  const alumni = fs.readFileSync(path.join(temp, 'data/people/alumni.csv'), 'utf8')
  assert.match(alumni, /New Graduate,msr,2024/)
  assert.match(alumni, /Faculty at Example University/)
  assert.doesNotMatch(alumni, /Quiet Person/)
  assert.match(alumni, /Gone Person,msr,2019,.*draft/)

  const imagePath = path.join(temp, 'assets/images/news/sit-launches-annual-research-to-impact-collaboration-ric.jpg')
  const meta = await sharp(imagePath).metadata()
  assert.equal(meta.width, 2400)
  assert.equal(meta.exif, undefined)
  const hash = createHash('sha256').update(fs.readFileSync(imagePath)).digest('hex')

  const again = await importForms(options)
  assert.deepEqual(again.errors, [])
  assert.equal(again.changed, false)
  assert.equal(again.inserted, 0)
  assert.equal(again.updated, 0)
  assert.equal(again.deleted, 0)
  for (const file of files) {
    assert.equal(fs.readFileSync(path.join(temp, file), 'utf8'), fs.readFileSync(path.join(expectedRoot, file), 'utf8'))
  }
  assert.equal(createHash('sha256').update(fs.readFileSync(imagePath)).digest('hex'), hash)
  assert.deepEqual(fs.readFileSync(path.join(repoRoot, 'data/news.csv')), repoNews)
})

test('a project faculty email id is stored as the faculty name', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sit-faculty-'))
  const incoming = path.join(root, 'incoming')
  fs.mkdirSync(path.join(root, 'data/people'), { recursive: true })
  fs.mkdirSync(incoming, { recursive: true })
  fs.writeFileSync(
    path.join(root, 'data/people/faculty.csv'),
    'name,email\nAaditeshwar Seth,aseth@iitd.ac.in\nSubodh Sharma,svs@iitd.ac.in\n',
  )
  fs.writeFileSync(
    path.join(root, 'data/projects.csv'),
    'id,title,thrust_area,stage,status,summary,description_md,faculty,partners,sponsor,seeking,background,website,image,initiative,start_year,featured,published,last_updated\n',
  )
  fs.writeFileSync(
    path.join(incoming, 'projects.csv'),
    [
      'Project title,Thrust area,Stage,Status,One-to-two-sentence summary,Lead and co-faculty,moderation',
      'Email id project,Sustainability and social development,"Initiative (several co-owners, products/platforms, external funding)",Ongoing,A summary.,aseth@cse.iitd.ac.in; svs; Someone Else,published',
    ].join('\n'),
  )
  try {
    const result = await importForms({ root, fromDir: incoming, today: '2026-10-25' })
    assert.deepEqual(result.errors, [])
    const written = fs.readFileSync(path.join(root, 'data/projects.csv'), 'utf8')
    assert.match(written, /initiative/)
    assert.match(written, /Aaditeshwar Seth;Subodh Sharma;Someone Else/)
    assert.doesNotMatch(written, /aseth/)
    assert.doesNotMatch(written, /svs/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})

test('a blank cell keeps the value, a dash clears it, and pending does not change visibility', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sit-blank-'))
  const incoming = path.join(root, 'incoming')
  fs.mkdirSync(path.join(root, 'data'), { recursive: true })
  fs.mkdirSync(incoming, { recursive: true })
  fs.writeFileSync(
    path.join(root, 'data/news.csv'),
    'id,date,category,title,summary,body_md,link,image,thrust_area,featured,status,submitted_by\nkeep-me,2024-01-01,announcement,Keep me,Original summary.,Body stays.,https://example.com/old,,sustainability-and-social-development,TRUE,published,\n',
  )
  fs.writeFileSync(
    path.join(root, 'data/events.csv'),
    'id,title,type,start_date,end_date,venue,summary,registration_url,image,status\n',
  )
  fs.writeFileSync(
    path.join(incoming, 'news.csv'),
    [
      'Headline,Date of the news,Category,One-paragraph summary,Full text,Link for more information,Thrust area,status,featured,Bonus',
      'Keep me,,Announcement,Updated summary,-,,,pending,FALSE,ignored',
      'Brand new,2026-10-25,Announcement,Fresh.,,,,rejected,,',
    ].join('\n'),
  )
  fs.writeFileSync(
    path.join(incoming, 'events.csv'),
    [
      'Event title,Type,Start date,Venue,Summary,Link,Image,status',
      'Alias day,Talk,2026-10-25,IIT Delhi,A summary,https://example.com/event,,published',
    ].join('\n'),
  )
  try {
    const result = await importForms({ root, fromDir: incoming, today: '2026-10-25' })
    assert.deepEqual(result.errors, [])
    assert.ok(result.warnings.some((warning) => warning.includes('unmapped columns: Bonus')))
    const news = fs.readFileSync(path.join(root, 'data/news.csv'), 'utf8')
    assert.match(news, /Keep me,Updated summary,,https:\/\/example\.com\/old/)
    assert.match(news, /https:\/\/example\.com\/old/)
    assert.match(news, /sustainability-and-social-development/)
    assert.match(news, /,FALSE,published,/)
    assert.doesNotMatch(news, /Body stays/)
    assert.doesNotMatch(news, /Brand new/)
    const events = fs.readFileSync(path.join(root, 'data/events.csv'), 'utf8')
    assert.match(events, /alias-day,Alias day,talk,2026-10-25,,IIT Delhi,A summary,https:\/\/example.com\/event,,published/)
  } finally {
    fs.rmSync(root, { recursive: true, force: true })
  }
})
