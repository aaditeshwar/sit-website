import { people } from './content'
import { publicText } from './editorial'
import { emailLocalPart, normalisePersonName } from './names'

type DirectoryPerson = {
  name: string
  photo?: string
  profile_url?: string
  email?: string
}

const directory = new Map<string, DirectoryPerson>()

function indexPeople() {
  if (directory.size) return
  for (const person of [...people.faculty, ...people.formerFaculty] as DirectoryPerson[]) {
    addPerson(normalisePersonName(person.name), person)
    addPerson(emailLocalPart(person.email ?? ''), person)
  }
}

function addPerson(key: string | undefined, person: DirectoryPerson) {
  if (!key || directory.has(key)) return
  directory.set(key, person)
}

export function facultyMember(name: string): DirectoryPerson | undefined {
  indexPeople()
  const local = emailLocalPart(name)
  if (local) {
    const byEmail = directory.get(local)
    if (byEmail) return byEmail
  }
  return directory.get(normalisePersonName(name))
}

export function facultyLabel(name: string): string {
  return facultyMember(name)?.name ?? name
}

export function facultyProfile(name: string): string | undefined {
  return publicText(facultyMember(name)?.profile_url)
}
