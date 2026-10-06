import { timingSafeEqual } from "node:crypto"
import { revalidateTag } from "next/cache"
import { NextRequest, NextResponse } from "next/server"

const ALLOWED_TAGS = new Set(["products", "categories", "collections"])

function secretsMatch(received: string, expected: string): boolean {
  const receivedBuffer = Buffer.from(received)
  const expectedBuffer = Buffer.from(expected)

  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  )
}

export async function POST(request: NextRequest) {
  const secret = process.env.STOREFRONT_REVALIDATE_SECRET
  const authorization = request.headers.get("authorization") ?? ""
  const receivedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : ""

  if (!secret || !secretsMatch(receivedSecret, secret)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { tags?: unknown }
  const tags = Array.isArray(body.tags)
    ? [...new Set(body.tags.filter((tag): tag is string => ALLOWED_TAGS.has(tag)))]
    : []

  if (!tags.length) {
    return NextResponse.json({ message: "No valid cache tags supplied" }, { status: 400 })
  }

  for (const tag of tags) {
    revalidateTag(tag)
  }

  return NextResponse.json({ revalidated: true, tags })
}
