import { BASE_URL } from "../eMaylClient"
import { IUser } from "../types"
import { ensureTokensAreNotExpired } from "./refreshTokens"

export async function getProfile(): Promise<IUser | null>  {
  try {
    const tokensAndHeaders = await ensureTokensAreNotExpired()
    const response = await fetch(`${BASE_URL}/profile`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokensAndHeaders.tokens.accessToken}`
      }
    })
    if (!response.ok) {
      console.log(`getProfile() failed: code=${response.status}`)
      return Promise.resolve(null)
    }
    const user: IUser = await response.json()
    return Promise.resolve(user)
  } catch(e) {
    console.log("getProfile error:", e)
  }
  return Promise.resolve(null)
}