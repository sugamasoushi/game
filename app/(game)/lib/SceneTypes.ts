import { Player } from "../gamemain/view/character/Player";
import { TileMap } from "../gamemain/view/TileMap";
import { MapObject } from "../gamemain/view/MapObject";
import { FieldData } from './FieldTypes';
import { GameKeys } from "./CommonTypes";

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
