import { BattleScene, State } from "../../lib/types";
import { BattleModel } from "../model/BattleModel";
import { TurnModel } from "../model/TurnModel";
import { BattleMessageWindow } from "../view/BattleMessageWindow";
import { PlayerPartyWindow } from "../view/PlayerPartyWindow";

import PlayerAttack from "./PlayerAttack";
import PlayerGuard from "./PlayerGuard";
import PlayerAvoid from "./PlayerAvoid";
import EnemyAttack from "./EnemyAttack";

import { gameStateManager } from "../../core/GameStateManager";
import { Sound } from "../../scenes/Sound";

// 攻撃・防御・回避の実行と勝敗判定を担う
export class BattleExecutor {

    // オート戦闘フラグ（攻撃対象を自動選択するかどうか）
    private autoFlg: boolean = false;

    constructor(
        private battleScene: BattleScene,
        private soundScene: Sound,
        private battleModel: BattleModel,
        private turnModel: TurnModel,
        private battleMessageWindow: BattleMessageWindow,
        private playerPartyWindow: PlayerPartyWindow
    ) { }

    // オート戦闘フラグを設定
    public setAutoFlg(autoFlg: boolean) {
        this.autoFlg = autoFlg;
    }

    // 現在ターンのキャラクターの行動を実行し、勝敗を判定する
    public async battle(battler: Phaser.GameObjects.GameObject) {
        let winner = '';
        console.log('戦闘開始:', battler.getData('name'));

        // 攻撃：対象の敵が設定されているかつ攻撃者のHPが0以上の場合のみ攻撃
        if (battler.getData('NpcType') !== 'enemy' && battler.data.values.HP > 0) {

            if (this.autoFlg) {
                // プレイヤーキャラクターの攻撃対象を設定
                const targetEnemy = this.battleModel.getPlayerAutoAttackTarget();
                battler.setData('BattleTarget', targetEnemy);
            }

            // 攻撃意図の確認（スキルが防御系かどうか）
            const skillDetail = battler.getData('UseSkill');
            const target = battler.getData('BattleTarget');

            if (skillDetail?.type === 'guard') {
                // 防御を選択している場合
                const playerGuard = new PlayerGuard(this.battleScene);
                await playerGuard.guard(this.battleMessageWindow, battler as Phaser.GameObjects.Sprite);

            } else if (skillDetail?.type === 'avoid') {
                // 回避を選択している場合
                const playerAvoid = new PlayerAvoid(this.battleScene);
                await playerAvoid.avoid(this.battleMessageWindow, battler as Phaser.GameObjects.Sprite);

            } else {
                // 攻撃（通常攻撃・特技・魔法）の場合、ターゲットの生存チェック
                if (!target || target.getData('HP') <= 0) {
                    // ターゲットが不在、または既に倒れている場合
                    await this.battleMessageWindow.messageOutput('相手がいない！！', 1000);
                } else {
                    // 正常に攻撃実行
                    const playerAttack = new PlayerAttack(this.battleScene);
                    await playerAttack.attack(this.battleMessageWindow, battler as Phaser.GameObjects.Sprite);
                }
            }

        } else if (battler.getData('NpcType') === 'enemy' && battler.data.values.HP > 0) {
            const enemyAttack = new EnemyAttack(this.battleScene, this.battleModel, this.playerPartyWindow);
            await enemyAttack.attack(this.battleMessageWindow, battler as Phaser.GameObjects.Image);
        }

        // 味方のHPをチェック
        if (!this.checkPlayerStatus()) {
            console.log('enemy勝利')
            this.soundScene.stopAllBgm();
            winner = 'enemy';
        }

        // 敵のHPをチェック
        if (!this.checkEnemyStatus()) {
            console.log('player勝利')
            this.soundScene.stopAllBgm();
            winner = 'player';
        }

        // 勝利
        if (winner === 'player') {
            // gameStateManager.addMoney(10);
            gameStateManager.updateState({ money: gameStateManager.currentMoney + 100 }, 'system');
            this.soundScene.playSe('SE_victory');

            await this.battleMessageWindow.messageOutput('勝利！', 2000);

            // 敵キャラを削除
            this.battleModel.deleteEnemy();

            // HPが0以下のメンバーは1にする（現状、戦闘終了後は必ず１残す）
            this.battleModel.checkPlayerPartyHP();

            this.battleScene.endScene();

        } else if (winner === 'enemy') {

            // ゲームオーバー
            //gameStateManager.triggerGameOver();
            gameStateManager.updateState({ state: State.GAMEOVER }, 'system');
        }

        // ターンを更新
        if (!winner) {
            this.turnModel.nextTurn();
        }
    }

    // 味方が1人でも生存していれば継続可能
    private checkPlayerStatus() {
        let continueFlag = false;
        for (const list of this.battleModel.getPlayerPartyList()) {
            if (list.data.values.HP > 0) {
                continueFlag = true;
            }
        }
        return continueFlag;
    }

    // 敵が1体でも生存していれば継続可能
    private checkEnemyStatus() {
        let continueFlag = false;
        for (const list of this.battleModel.getEnemyPartyList()) {
            if (list.data.values.HP > 0) {
                continueFlag = true;
            }
        }
        return continueFlag;
    }
}
