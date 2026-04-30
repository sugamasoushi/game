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

export interface animationKey {
  spriteSheetKey: string,
  walkLeft: string,
  walkRight: string,
  walkUp: string,
  walkDown: string,
  walkStop: string,
  standLeft: string,
  standRight: string,
  standUp: string,
  standDown: string,
  moveDirection: string,
  standframe: string,
}
