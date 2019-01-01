export default function kebabToCamel(str: string) {
  return str.replace(/(\-\w)/g, m => m[1].toUpperCase())
}
