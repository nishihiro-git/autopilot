declare module "facebook-nodejs-business-sdk" {
  export class FacebookAdsApi {
    static init(accessToken: string): void;
  }

  export class AdAccount {
    constructor(id: string);
    create(fields: string[], params: any): Promise<Ad>;
  }

  export class AdCreative {
    constructor(id: string);
    create(fields: string[], params: any): Promise<AdCreative>;
  }

  export class Ad {
    constructor(id: string);
    create(fields: string[], params: any): Promise<Ad>;
    update(fields: string[], params: any): Promise<Ad>;
    id: string;
  }
}
