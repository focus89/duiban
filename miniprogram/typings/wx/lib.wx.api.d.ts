declare namespace WechatMiniprogram {
  interface SystemInfo {
    brand: string;
    model: string;
    pixelRatio: number;
    screenWidth: number;
    screenHeight: number;
    windowWidth: number;
    windowHeight: number;
    statusBarHeight: number;
    language: string;
    version: string;
    system: string;
    platform: string;
    fontSizeSetting: number;
    SDKVersion: string;
  }

  interface TouchEvent extends BaseEvent {
    touches: Array<{
      identifier: number;
      pageX: number;
      pageY: number;
      clientX: number;
      clientY: number;
    }>;
    changedTouches: Array<{
      identifier: number;
      pageX: number;
      pageY: number;
      clientX: number;
      clientY: number;
    }>;
    detail: {
      current: number;
      source: string;
    };
  }

  interface BaseEvent {
    type: string;
    timeStamp: number;
    target: {
      id: string;
      dataset: Record<string, any>;
    };
    currentTarget: {
      id: string;
      dataset: Record<string, any>;
    };
  }

  interface InnerAudioContext {
    src: string;
    startTime: number;
    autoplay: boolean;
    loop: boolean;
    obeyMuteSwitch: boolean;
    volume: number;
    duration: number;
    currentTime: number;
    paused: boolean;
    buffered: number;
    play(): void;
    pause(): void;
    stop(): void;
    seek(position: number): void;
    destroy(): void;
    onCanplay(callback: () => void): void;
    onPlay(callback: () => void): void;
    onPause(callback: () => void): void;
    onStop(callback: () => void): void;
    onEnded(callback: () => void): void;
    onTimeUpdate(callback: () => void): void;
    onError(callback: (res: { errMsg: string }) => void): void;
    onWaiting(callback: () => void): void;
    onSeeking(callback: () => void): void;
    onSeeked(callback: () => void): void;
    offCanplay(callback: () => void): void;
    offPlay(callback: () => void): void;
    offPause(callback: () => void): void;
    offStop(callback: () => void): void;
    offEnded(callback: () => void): void;
    offTimeUpdate(callback: () => void): void;
    offError(callback: (res: { errMsg: string }) => void): void;
    offWaiting(callback: () => void): void;
    offSeeking(callback: () => void): void;
    offSeeked(callback: () => void): void;
  }

  interface UploadFileOption {
    url: string;
    filePath: string;
    name: string;
    header?: object;
    formData?: object;
    success?: (res: { data: string; statusCode: number }) => void;
    fail?: (res: { errMsg: string }) => void;
    complete?: () => void;
  }

  type Instance<T extends IAnyObject = any> = {
    setData: (data: Partial<T>, callback?: () => void) => void;
    data: T;
  } & IAnyObject;

  interface IAnyObject {
    [key: string]: any;
  }

  type IAppOption = {
    globalData?: {
      [key: string]: any;
    };
    onLaunch?: (options: any) => void;
    onShow?: (options: any) => void;
    onHide?: () => void;
    onError?: (error: string) => void;
    onPageNotFound?: (options: any) => void;
    onUnhandledRejection?: (options: any) => void;
  };
}

declare interface Wx {
  getSystemInfoSync(): WechatMiniprogram.SystemInfo;
  showToast(options: {
    title: string;
    icon?: 'success' | 'error' | 'loading' | 'none';
    duration?: number;
    mask?: boolean;
  }): void;
  showModal(options: {
    title: string;
    content: string;
    showCancel?: boolean;
    cancelText?: string;
    confirmText?: string;
    success?: (result: { confirm: boolean; cancel: boolean }) => void;
  }): void;
  showShareMenu(options: {
    withShareTicket?: boolean;
    menus?: string[];
  }): void;
  createInnerAudioContext(): WechatMiniprogram.InnerAudioContext;
  uploadFile(option: WechatMiniprogram.UploadFileOption): void;
  stopPullDownRefresh(): void;
  cloud: ICloud;
}

declare function App<T extends WechatMiniprogram.IAppOption>(app: T): void;
declare function Page<T extends WechatMiniprogram.IAnyObject>(page: T & {
  data?: any;
  setData?: (data: any, callback?: () => void) => void;
}): void;
declare function Component<T extends WechatMiniprogram.IAnyObject>(component: T): void;
declare function getApp<T extends WechatMiniprogram.IAppOption>(): T;
declare function getCurrentPages(): WechatMiniprogram.Instance[]; 