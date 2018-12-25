const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

export default function generateId(length = 10) {
  let id = ''

  for (let i = 0; i < length; i++) {
    id += CHARACTERS.charAt(Math.floor(Math.random() * CHARACTERS.length))
  }

  return id
}
