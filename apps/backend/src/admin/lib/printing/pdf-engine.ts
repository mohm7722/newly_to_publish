import html2canvas from "html2canvas"
import { jsPDF } from "jspdf"

/**
 * PDF export engine (swappable).
 *
 * This is the ONLY module that knows *how* a document node becomes a PDF.
 * Today it rasterizes the DOM with html2canvas (which renders Arabic/RTL
 * correctly via the browser) and lays it into a multi-page A4 PDF with jsPDF.
 *
 * To switch engines later (e.g. server-side Puppeteer/Playwright for selectable
 * text), replace ONLY this file's {@link exportNodeToPdf} implementation — its
 * signature is the stable contract used by {@link useDocumentExport} and every
 * document template. No template or data code needs to change.
 */
export type ExportOptions = {
  /** Saved file name (without extension is fine; `.pdf` is appended). */
  filename?: string
  orientation?: "portrait" | "landscape"
  /** Rasterization scale; higher = sharper but larger. */
  scale?: number
}

export async function exportNodeToPdf(
  node: HTMLElement,
  options: ExportOptions = {}
): Promise<void> {
  const { orientation = "portrait", scale = 2 } = options

  const canvas = await html2canvas(node, {
    scale,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
  })

  const imgData = canvas.toDataURL("image/png")
  const pdf = new jsPDF({ orientation, unit: "pt", format: "a4" })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  let heightLeft = imgHeight
  let position = 0

  pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
  heightLeft -= pageHeight

  while (heightLeft > 0) {
    position -= pageHeight
    pdf.addPage()
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
  }

  let filename = options.filename?.trim() || "document"
  if (!filename.toLowerCase().endsWith(".pdf")) {
    filename += ".pdf"
  }
  pdf.save(filename)
}
