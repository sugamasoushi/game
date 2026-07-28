import { TileMap } from "../field/view/TileMap";
import { CameraManager } from "../field/view/CameraManager";
export interface FieldScene extends Phaser.Scene {
  getMainCamera(): Phaser.Cameras.Scene2D.Camera;
  resumeScene(): void;
  getMakeTilemap(): Phaser.Tilemaps.Tilemap;
  getTileMapInstance(): TileMap;
  getCameraManagerInstance(): CameraManager
}

export interface EventScene extends Phaser.Scene {
  getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
  getMainCamera(): Phaser.Cameras.Scene2D.Camera;
}

export interface BattleScene extends Phaser.Scene {
  getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
  getMainCamera(): Phaser.Cameras.Scene2D.Camera;
  endScene(): void;
}
