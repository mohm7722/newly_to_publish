import { createHash, randomUUID } from "crypto"
import { createReadStream } from "fs"
import { mkdir, open, readFile, rename, rm } from "fs/promises"
import path from "path"
import type { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"

export const MAX_PROOF_BYTES = 5 * 1024 * 1024

const ROOT = process.env.MANUAL_TRANSFER_PROOF_DIR ||
  (process.env.NODE_ENV === "production"
    ? "/var/lib/newly/manual-transfer-proofs"
    : path.resolve(process.cwd(), "data", "manual-transfer-proofs"))

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
}

export type StoredProof = {
  storageKey: string
  originalName: string
  mimeType: string
  size: number
  sha256: string
}

function invalid(message: string): never {
  throw new MedusaError(MedusaError.Types.INVALID_DATA, message)
}

function detectMime(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg"
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png"
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString() === "RIFF" && bytes.subarray(8, 12).toString() === "WEBP") return "image/webp"
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString() === "%PDF-") return "application/pdf"
  return null
}
function safeOriginalName(value: string | undefined): string {
  const decoded = (() => {
    try { return decodeURIComponent(value || "proof") } catch { return "proof" }
  })()
  return path.basename(decoded).replace(/[^\p{L}\p{N}._ -]/gu, "_").slice(0, 180) || "proof"
}

export async function storeProof(req: MedusaRequest): Promise<StoredProof> {
  const declaredLength = Number(req.headers["content-length"] || 0)
  if (declaredLength > MAX_PROOF_BYTES) invalid("حجم الإشعار يجب ألا يتجاوز 5MB")

  await mkdir(ROOT, { recursive: true })
  const tempKey = `.upload-${randomUUID()}.tmp`
  const tempPath = path.join(ROOT, tempKey)
  const file = await open(tempPath, "wx", 0o600)
  const hash = createHash("sha256")
  let size = 0
  const headerChunks: Buffer[] = []

  try {
    for await (const raw of req) {
      const chunk = Buffer.isBuffer(raw) ? raw : Buffer.from(raw)
      size += chunk.length
      if (size > MAX_PROOF_BYTES) invalid("حجم الإشعار يجب ألا يتجاوز 5MB")
      if (Buffer.concat(headerChunks).length < 16) headerChunks.push(chunk.subarray(0, 16))
      hash.update(chunk)
      await file.write(chunk)
    }
    await file.close()
    if (size === 0) invalid("ملف إشعار الإيداع مطلوب")

    const detected = detectMime(Buffer.concat(headerChunks).subarray(0, 16))
    if (!detected || !EXTENSIONS[detected]) invalid("يُسمح فقط بملفات JPG أو PNG أو WebP أو PDF")
    const declared = String(req.headers["content-type"] || "").split(";")[0].toLowerCase()
    if (declared && declared !== "application/octet-stream" &&
        !(detected === "image/jpeg" && declared === "image/jpg") && declared !== detected) {
      invalid("نوع الملف المعلن لا يطابق محتواه")
    }

    const storageKey = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}${EXTENSIONS[detected]}`
    const finalPath = path.join(ROOT, storageKey)
    await mkdir(path.dirname(finalPath), { recursive: true })
    await rename(tempPath, finalPath)
    return {
      storageKey,
      originalName: safeOriginalName(req.headers["x-file-name"] as string | undefined),
      mimeType: detected,
      size,
      sha256: hash.digest("hex"),
    }
  } catch (error) {
    await file.close().catch(() => undefined)
    await rm(tempPath, { force: true }).catch(() => undefined)
    throw error
  }
}
function resolveStoredPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/")
  if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}\/[a-f0-9-]+\.(jpg|png|webp|pdf)$/.test(normalized)) {
    invalid("Invalid proof storage key")
  }
  const resolved = path.resolve(ROOT, normalized)
  if (!resolved.startsWith(path.resolve(ROOT) + path.sep)) invalid("Invalid proof storage key")
  return resolved
}

export function openProofStream(storageKey: string) {
  return createReadStream(resolveStoredPath(storageKey))
}

export async function readProof(storageKey: string): Promise<Buffer> {
  return readFile(resolveStoredPath(storageKey))
}

export async function deleteProof(storageKey?: string | null): Promise<void> {
  if (!storageKey) return
  await rm(resolveStoredPath(storageKey), { force: true })
}
