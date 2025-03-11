import { Emaylias, EmayliasAction, EmayliasListResult, UserProfile } from "./types";
import { removeAllCookies } from "./util/cookies";
import { ensureTokensAreNotExpired } from "./util/refreshTokens";

export const BASE_URL = 'https://api.emayl.ai/dev/v0.1.0';

export default class EmaylService {
  public async changeEmayliasState(emayliasId: string, action: EmayliasAction): Promise<void> {
    console.log("changeEmayliasState - action =", action)
    try {
      const tokensAndHeaders = await ensureTokensAreNotExpired()
      const response = await fetch(`${BASE_URL}/emaylias/${emayliasId}/state:${action}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokensAndHeaders.tokens.accessToken}`
        }
      })
      if (!response.ok) {
        console.log(`changeEmayliasState() failed: code=${response.status}`)
        return Promise.reject(response.statusText)
      }
      console.log("changeEmayliasState successful")
      return Promise.resolve()
    } catch(e) {
      console.log("getProfile error:", e)
      return Promise.reject(e.toString())
    }
  }
  /**
   * Get the user profile if user is authenticated
   */
  public async getProfile(): Promise<UserProfile> {
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
        return Promise.reject(response.statusText)
      }
      const user: UserProfile = await response.json()
      return Promise.resolve(user)
    } catch(e) {
      console.log("getProfile error:", e)
      return Promise.reject(e.toString())
    }
  }

  /**
   * Get array of Emaylias objects, if user is authenticated
   */
  public getList = async (): Promise<Emaylias[]> => {
    console.log("eMayliasService::getList")
    try {
      const tokensAndHeaders = await ensureTokensAreNotExpired()
      const res = await fetch(`${BASE_URL}/emaylias`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokensAndHeaders.tokens.accessToken}`
        }
      })  
      if (!res.ok) {
        console.log("getList - !res.ok - error:", res.status)
        return Promise.reject(res.statusText)
      }
      const jsonRes: EmayliasListResult = await res.json()
      return Promise.resolve(jsonRes.emayliasList)
    } catch(e) {
      console.log("getList error:", e)
      return Promise.reject(e.toString())
    }  
  };

  // TODO: This is probably not needed
  reserveEmaylias(email: string, label: string) {
    throw new Error('Method not implemented.');
  }

  generateEmails(): string[] | PromiseLike<string[]> {
    throw new Error('Method not implemented.');
  }

  public async isAuthenticated(): Promise<boolean> {
    try {
      const tokensAndHeaders = await ensureTokensAreNotExpired()
      return tokensAndHeaders.tokens.accessToken != undefined;
    } catch {
      return false;
    }
  }

  public async signOut(): Promise<void> {
    console.log("signOut()")
    try {
      const tokensAndHeaders = await ensureTokensAreNotExpired()
      const res = await fetch(`${BASE_URL}/logout`, {
        method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokensAndHeaders.tokens.accessToken}`
        }
      })  
      if (!res.ok) {
        console.log("!res.ok - error:", res.status);
      } else {
        console.log("signOut() successful")
      }
    } finally {
      removeAllCookies()
      Promise.resolve()
    }  
  }
}
