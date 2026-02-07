import JSZip from 'jszip'

export async function downloadZip(files: { name: string, blob: Blob }[], zipName: string = 'POs.zip') {
  const zip = new JSZip()
  files.forEach(file => {
    zip.file(file.name, file.blob)
  })
  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)
  const a = document.createElement('a')
  a.href = url
  a.download = zipName
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
