import EmaylClient, { UnsuccessfulRequestError } from "./eMaylClient";
import { Emaylias, EmayliasListResult } from "./types";

export class GenerateHmeException extends Error {}
export class ReserveHmeException extends Error {}
export class UpdateAliasException extends Error {}
export class DeactivateHmeException extends Error {}
export class ReactivateHmeException extends Error {}
export class DeleteHmeException extends Error {}
export class UpdateFwdToHmeException extends Error {}

type PremiumMailSettingsResponse<T> = {
  success: boolean;
  result: T;
  error?: {
    errorMessage: string;
  };
};
  
export class PremiumMailSettings {
  private readonly baseUrl: string;
  constructor(readonly client: EmaylClient) {
    this.baseUrl = `${client.webserviceUrl('premiummailsettings')}/v1`;
  }
  
  async getList(): Promise<EmayliasListResult> {
      throw new UnsuccessfulRequestError(`getList not implemented`);
  // const { result } = (await this.client.request(
  //     'GET',
  //     `${this.v2BaseUrl}/hme/list`
  //   )) as PremiumMailSettingsResponse<EmayliasListResult>;
  //   return result;
  }
  
  async generateEmail(): Promise<string> {
    throw new UnsuccessfulRequestError(`generateEmail not implemented`);
    // const response = (await this.client.request(
    //   'POST',
    //   `${this.baseUrl}/hme/generate`
    // )) as PremiumMailSettingsResponse<{ email: string }>;

    // if (!response.success) {
    //   throw new GenerateHmeException(response.error?.errorMessage);
    // }
    // return response.result.email;
  }
  
  async reserveEmaylias(
    email: string,
    label: string,
    note:
      | string
      | undefined = 'Generated through the eMayl browser extension'
  ): Promise<Emaylias> {
    throw new UnsuccessfulRequestError(`reserveEmaylias not implemented`);
    // const response = (await this.client.request(
    //   'POST',
    //   `${this.baseUrl}/hme/reserve`,
    //   { data: { email, label, note } }
    // )) as PremiumMailSettingsResponse<{ emaylias: Emaylias }>;

    // if (!response.success) {
    //   throw new ReserveHmeException(response.error?.errorMessage);
    // }
    // return response.result.emaylias;
  }
  
  async updateAlias(
    id: string,
    label: string,
    note?: string
  ): Promise<void> {
    throw new UnsuccessfulRequestError(`updateAlias not implemented`);
    // const response = (await this.client.request(
    //   'POST',
    //   `${this.baseUrl}/hme/updateMetaData`,
    //   { data: { id, label, note } }
    // )) as PremiumMailSettingsResponse<void>;

    // if (!response.success) {
    //   throw new UpdateAliasException('Failed to update');
    // }
  }

  async deactivateAlias(id: string): Promise<void> {
    throw new UnsuccessfulRequestError(`deactivateAlias not implemented`);
    // const response = (await this.client.request(
    //   'POST',
    //   `${this.baseUrl}/hme/deactivate`,
    //   { data: { id } }
    // )) as PremiumMailSettingsResponse<void>;

    // if (!response.success) {
    //   throw new DeactivateHmeException('Failed to deactivate');
    // }
  }
  
  async reactivateAlias(id: string): Promise<void> {
    throw new UnsuccessfulRequestError(`reactivateAlias not implemented`);
    // const response = (await this.client.request(
    //   'POST',
    //   `${this.baseUrl}/hme/reactivate`,
    //   { data: { id } }
    // )) as PremiumMailSettingsResponse<void>;

    // if (!response.success) {
    //   throw new ReactivateHmeException('Failed to reactivate');
    // }
  }

  async deleteAlias(id: string): Promise<void> {
    throw new UnsuccessfulRequestError(`deleteAlias not implemented`);
    // const response = (await this.client.request(
    //   'POST',
    //   `${this.baseUrl}/hme/delete`,
    //   { data: { id } }
    // )) as PremiumMailSettingsResponse<void>;

    // if (!response.success) {
    //   throw new DeleteHmeException('Failed to delete');
    // }
  }

  async updateForwardTo(forwardToEmail: string): Promise<void> {
    throw new UnsuccessfulRequestError(`updateForwardTo not implemented`);
    // const response = (await this.client.request(
    //   'POST',
    //   `${this.baseUrl}/hme/updateForwardTo`,
    //   { data: { forwardToEmail } }
    // )) as PremiumMailSettingsResponse<void>;

    // if (!response.success) {
    //   throw new UpdateFwdToHmeException('Failed to update the Forward To email.');
    // }
  }
}
