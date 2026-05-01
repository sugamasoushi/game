import { FieldData } from "./FieldTypes";
import { Npc } from "../gamemain/view/character/Npc";
import { ViewsContainer } from "./BattleTypes";
import { ActorState } from "../core/ActorState";
// import * as Phaser from 'phaser';

export enum State {
  NOSTATE = 0,
  START = 10,
  LOAD = 150,
  FIELD = 20,
  FIELD_RESTART = 21,
  FIELD_RESUME = 22,
  BATTLE = 30,
  EVENT = 40,
  BUBBLE_TALK = 45,
  GAMEOVER = 50
}

export interface GameState {
  state: State;
  sceneKey?: string; // 更新元のキーを追加
  money: number;
  playerPartyList: Phaser.GameObjects.Sprite[];
  playerActorList: ActorState[];
  battleFlag: boolean;
  isGameOver: boolean;
  fieldData: FieldData;
  battleData: { usePatern: string, fieldHitEnemy?: Npc, canNotRunaway: boolean };
  battleBackGroundKey: string;
  eventObj?: Phaser.Physics.Arcade.Sprite;
}

/** 状態（State）の振る舞い */
export interface StateDefinition {
  enter: (views: ViewsContainer, payload?: Phaser.GameObjects.Sprite | undefined) => void;
  exit: (views: ViewsContainer) => void;
}
