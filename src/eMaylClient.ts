import { removeAllCookies } from "./util/cookies";
import { ensureTokensAreNotExpired } from "./util/refreshTokens";

export class UnsuccessfulRequestError extends Error {}

type ServiceName = 'premiummailsettings';

export const BASE_URL = 'https://api.emayl.ai/dev/v0.1.0';

export default class EmaylClient {
  constructor(
    readonly setupUrl: typeof BASE_URL,
    public webservices?: Record<ServiceName, { url: string; status: string }>
  ) {}

  // public async request(
  //   method: 'GET' | 'POST',
  //   url: string,
  //   options: {
  //     headers?: Record<string, string>;
  //     data?: Record<string, unknown>;
  //   } = {}
  // ): Promise<unknown> {
  //   const { headers = {}, data = undefined } = options;

  //   const response = await fetch(url, {
  //     method,
  //     headers,
  //     body: data !== undefined ? JSON.stringify(data) : undefined,
  //   });

  //   if (!response.ok) {
  //     throw new UnsuccessfulRequestError(
  //       `Request to ${method} ${url} failed with status code ${response.status}`
  //     );
  //   }

  //   return await response.json();
  // }

  public webserviceUrl(serviceName: ServiceName): string {
    if (this.webservices === undefined) {
      throw new Error('webservices have not been initialised');
    }
    return this.webservices[serviceName].url;
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
    }  
  }
}
