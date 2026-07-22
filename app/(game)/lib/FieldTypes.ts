export interface FieldData {
  gameMode: string;
  mapKey: string;
  x: number;
  y: number;
  x2: number;
  y2: number;
  initStandKey: string;
}

export interface tilesets {
  columns: number;
  firstgid: number;
  image: string;
  imageheight: number;
  imagewidth: number;
  margin: number;
  name: string;
  spacing: number;
  tilecount: number;
  tileheight: number;
  tilewidth: number;
}

export enum MapLayerDepth {
  Lowest = 100,   //最下層、水面などのシェーダー等
  Low = 200,      //下層、地面など
  High = 300,     //上層、キャラクターなど
  Highest = 400   //最上層、天井や空
}

export enum ObjState {
  false = 0,
  true = 1,
}

export enum CharacterState {
  noView = 0,
  normal = 1,
  stop = 2,
  talking = 3,
  walking = 4,
  event = 5
}

export enum EventObjState {
  false = 0,
  true = 1,
  nowEvent = 2
}

// export interface animationKey {
//   spriteSheetKey: string,
//   walkLeft: string,
//   walkRight: string,
//   walkUp: string,
//   walkDown: string,
//   walkStop: string,
//   standLeft: string,
//   standRight: string,
//   standUp: string,
//   standDown: string,
//   moveDirection: string,
//   standframe: string,
// }

export interface OptionData {
  masterVolume: number,
  bgmVolume: number,
  bgsVolume: number,
  seVolume: number,
  textSpeed: number, // 追加のオプション項目（例: テキスト表示速度）
}

export interface PropertyItem {
  name: string;
  type?: string;
  value: string | number | boolean | null | undefined;
}