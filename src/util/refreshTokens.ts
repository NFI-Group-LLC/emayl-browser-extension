import { BASE_URL } from "../eMaylClient"
import { ICookie } from "../types"
import { getLargeCookie, isTokenExpired, logExpiration, wrapCookie } from "./cookies"

async function updateRefreshToken(cookie: ICookie): Promise<ICookie | null> {
  const { subscriberId, refreshToken, emailAddress } = cookie
  const data = { subscriberId, refreshToken, emailAddress }
  const response = await fetch(`${BASE_URL}/token-refresh`, {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
})
  
  const resJSON = await response.json()
  if (!response.ok || !resJSON || !resJSON.accessToken) {
    console.log("updateRefreshToken failed with status=", response.status)
    return Promise.reject(null)
  }

  // this is only for debug purposes
  logExpiration("updateRefreshToken succeeded", resJSON.identityToken)

  return Promise.resolve(resJSON)
}

/**
 * This refreshes the tokens if expired and then fails out if unable to refresh successfully
 * 
 * Returns tokens and headers if valid, null if expired and unable to refresh
 */
export async function ensureTokensAreNotExpired() {
  const parsedCookie: ICookie = JSON.parse(decodeURIComponent(decodeURIComponent(await getLargeCookie())))
  if (!parsedCookie || !parsedCookie.identityToken || !parsedCookie.identityToken.length) {
    console.log("cookie or identityToken invalid")
    throw new Error()
  }
  logExpiration("ensureTokensAreNotExpired", parsedCookie.identityToken)

  if (isTokenExpired(parsedCookie?.identityToken)) {
    const newTokens = await updateRefreshToken(parsedCookie)
    if (!newTokens) {
      console.log("token error:", newTokens)
      throw new Error()
    }
    return { tokens: newTokens, headers: wrapCookie({ ...parsedCookie, ...newTokens }) }
  }

  return { tokens: parsedCookie }
}