// 基础元素接口
export interface Element {
  id: string;
  type: 'image' | 'shape' | 'text' | 'audio';
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  rotation?: number;
}

// 图片元素
export interface ImageElement extends Element {
  type: 'image';
  url: string;
  filter?: string;
}

// 形状元素
export interface ShapeElement extends Element {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'line';
  color: string;
  borderWidth?: number;
  borderColor?: string;
}

// 文本元素
export interface TextElement extends Element {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  alignment: 'left' | 'center' | 'right';
}

// 音频元素
export interface AudioElement extends Element {
  type: 'audio';
  url: string;
  duration: number;
  autoPlay: boolean;
  loop: boolean;
}

// 元素间关系
export interface ElementRelation {
  sourceId: string;
  targetId: string;
  type: 'trigger' | 'sync' | 'sequence';
  action: {
    type: string;
    params: any;
  };
}

// 页面结构
export interface Page {
  id: string;
  elements: (ImageElement | ShapeElement | TextElement | AudioElement)[];
  relations: ElementRelation[];
  backgroundColor: string;
  transition?: {
    type: 'slide' | 'fade' | 'none';
    duration: number;
  };
}

// 作品结构
export interface Work {
  id: string;
  title: string;
  pages: Page[];
  author: Author;
  stats: Stats;
  visibility: 'public' | 'private';
  isDraft?: boolean;
  draftId?: string;
  lastEditTime?: number;
}

// 作品列表
export interface WorkList {
  works: Work[];
  totalCount: number;
  cursor?: string;
  recommendationInfo?: {
    algorithm: string;
    score: number;
    factors: string[];
  };
}

export interface WorkDraft {
  id: string;
  workId?: string;
  work: Work;
  createTime: number;
  updateTime: number;
} 