//TypeScriptの型定義ファイル
export interface FieldData {
  gameMode: string;
  mapKey: string;
  x: number;
  y: number;
  initStandKey: string;
}

export interface EventObj {
  eventObj: Phaser.Physics.Arcade.Sprite;
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

import { Player } from "../gamemain/view/character/Player";
import { TileMap } from "../gamemain/view/TileMap";
import { MapObject } from "../gamemain/view/MapObject";
export interface GameScene extends Phaser.Scene {
  setBlackScreenRect(): Phaser.GameObjects.Rectangle;
  getFieldData(): FieldData;
  setPlayer(playerSprite: Player): void;
  getPlayer(): Player;
  getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
  getGameKeys(): GameKeys;
  getMainCamera(): Phaser.Cameras.Scene2D.Camera;
  getTilemap(): TileMap;
  getMapObject(): MapObject;
  getTilemapInPixels(): { widthInPixels: number, heightInPixels: number };
  resumeScene(): void;
}

export interface EventScene extends Phaser.Scene {
  getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
  getMainCamera(): Phaser.Cameras.Scene2D.Camera;
  //resumeScene(): void;
}

export interface BattleScene extends Phaser.Scene {
  getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
  getMainCamera(): Phaser.Cameras.Scene2D.Camera;
  endScene(): void;
}

//イベント定義
export interface Eventer {
  init(): void;
  execEvent(): void;
}

//addkeys()はオブジェクト型のため定義する必要がある。これはPhaserの意図的な設計。
export interface GameKeys {
  P: Phaser.Input.Keyboard.Key;
  H: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  E: Phaser.Input.Keyboard.Key;
  R: Phaser.Input.Keyboard.Key;
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

/** Viewが必ず持っておくべき機能 */
export interface IWindowView extends Phaser.GameObjects.Container {
  show(payload?: Phaser.GameObjects.Sprite | undefined): void;
  move(): void;
  hide(): void;
}

/** 状態（State）の振る舞い */
export interface StateDefinition {
  enter: (views: ViewsContainer, payload?: Phaser.GameObjects.Sprite | undefined) => void;
  exit: (views: ViewsContainer) => void;
}

/** Presenterが管理するViewの集まり */
export interface ViewsContainer {
  battleSelect: IWindowView;
  playerPartyWindow: IWindowView;
  attackSelect: IWindowView;
  enemySelectWindow: IWindowView;
  item: IWindowView;
}

export interface CharacterStatus {
  level: number,
  HP: number,
  MP: number,
  MaxHP: number,
  MaxMP: number,
  Attack: number,
  Guard: number,
  Speed: number,
  gold: number
}

export enum State {
  NOSTATE = 0,
  START = 10,
  LOAD = 150,
  FIELD = 20,
  FIELD_RESTART = 21,
  FIELD_RESUME = 22,
  BATTLE = 30,
  EVENT = 40,
  BUBBLE_TALK = 45
}

// 状態の型を定義
import { Npc } from "../gamemain/view/character/Npc";
export interface GameState {
  state: State;
  sceneKey?: string; // 更新元のキーを追加
  money: number;
  hp: number;
  battleFlag: boolean;
  isGameOver: boolean;
  fieldData: FieldData;
  battleData: { usePatern: string, fieldHitEnemy?: Npc, canNotRunaway: boolean };
  eventObj?: Phaser.Physics.Arcade.Sprite;
}


