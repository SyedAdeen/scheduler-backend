// metadata.interface.ts
export interface IntegrationMetadata {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  oauthUri: string;
  tokenUri: string;
  scope: string;
  configId?: string;
}
  