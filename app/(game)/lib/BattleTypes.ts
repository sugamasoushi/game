export interface IWindowView extends Phaser.GameObjects.Container {
  show(payload?: Phaser.GameObjects.Sprite | undefined): void;
  move(): void;
  hide(): void;
}

export interface ViewsContainer {
  battleSelect: IWindowView;
  playerPartyWindow: IWindowView;
  attackSelect: IWindowView;
  enemySelectWindow: IWindowView;
  item: IWindowView;
  specialSkillSelect: IWindowView;
  magicSkillSelect: IWindowView;
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
