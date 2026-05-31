
export interface FieldScene extends Phaser.Scene {
  getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys;
  getMainCamera(): Phaser.Cameras.Scene2D.Camera;
  resumeScene(): void;
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
