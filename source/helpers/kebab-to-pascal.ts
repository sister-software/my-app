export default function kebabToPascal(str: string) {
  const camel = str.replace(/(\-\w)/g, m => m[1].toUpperCase())

  return camel[0].toUpperCase() + camel.substring(1)
}
