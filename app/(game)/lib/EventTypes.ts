export interface EventObj {
  eventObj: Phaser.Physics.Arcade.Sprite;
}

export interface Eventer {
  init(): void;
  execEvent(): void;
}
