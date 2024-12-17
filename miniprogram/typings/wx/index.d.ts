/// <reference path="./lib.wx.api.d.ts" />

interface ICloud {
  init(config?: ICloudConfig): void;
  callFunction(param: {
    name: string;
    data?: any;
    config?: ICloudConfig;
    success?: (res: { result: any }) => void;
    fail?: (error: Error) => void;
    complete?: () => void;
  }): Promise<{ result: any }>;
}

interface ICloudConfig {
  env?: string;
  traceUser?: boolean;
}

interface Wx {
  cloud: ICloud;
}

declare const wx: Wx; 