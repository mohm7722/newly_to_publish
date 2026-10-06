import { createHmac } from "crypto"
import { NextRequest, NextResponse } from "next/server"

const MAX_LINK_AGE_SECONDS = 60 * 60 * 24 * 8

function validSignature(
  cartId: string,
  expires: number,
  provided: string
): boolean {
  const secret = process.env.CART_RESUME_SECRET
  const now = Math.floor(Date.now() / 1000)
  if (
    !secret ||
    !/^cart_[A-Za-z0-9_-]+$/.test(cartId) ||
    !Number.isInteger(expires) ||
    expires <= now ||
    expires > now + MAX_LINK_AGE_SECONDS ||
    !/^[a-f0-9]{64}$/i.test(provided)
  ) {
    return false
  }

  const expected = createHmac("sha256", secret)
    .update(`${cartId}.${expires}`)
    .digest("hex")
  let mismatch = 0
  for (let index = 0; index < expected.length; index += 1) {
    mismatch |= expected.charCodeAt(index) ^ provided.charCodeAt(index)
  }
  return mismatch === 0
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ countryCode: string }> }
) {
  const { countryCode } = await params
  const cartId = req.nextUrl.searchParams.get("cart_id") ?? ""
  const expires = Number(req.nextUrl.searchParams.get("expires"))
  const signature = req.nextUrl.searchParams.get("signature") ?? ""

  const redirectUrl = req.nextUrl.clone()
  redirectUrl.pathname = `/${countryCode}/cart`
  redirectUrl.search = validSignature(cartId, expires, signature)
    ? ""
    : "?resume_error=invalid"

  const response = NextResponse.redirect(redirectUrl)
  if (validSignature(cartId, expires, signature)) {
    response.cookies.set("_medusa_cart_id", cartId, {
      maxAge: Math.max(0, expires - Math.floor(Date.now() / 1000)),
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.COOKIE_SECURE === "true",
      path: "/",
    })
  }
  return response
}