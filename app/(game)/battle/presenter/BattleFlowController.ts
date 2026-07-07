import { BattleScene } from "../../lib/types";
import { BattleModel } from "../model/BattleModel";
import { CommandSelectModel } from "../model/CommandSelectModel";
import { TurnModel } from "../model/TurnModel";
import { PlayerPartyWindow } from "../view/PlayerPartyWindow";

import { StateMachine } from "./StateMachine";
import { BattleExecutor } from "./BattleExecutor";

// コマンド選択順とターン進行のイベント連携を担う
export class BattleFlowController {
    constructor(
        private battleScene: BattleScene,
        private battleModel: BattleModel,
        private commandSelectModel: CommandSelectModel,
        private turnModel: TurnModel,
        private playerPartyWindow: PlayerPartyWindow,
        private stateMachine: StateMachine,
        private executor: BattleExecutor
    ) { }

    // コマンド選択モデルとターンモデルのイベントを登録
    public setup() {
        this.setCommandSelectModel();
        this.setTurnModel();
    }

    // キャラクターのコマンド選択順序を管理する
    private setCommandSelectModel() {

        // 次キャラクターのコマンド選択
        this.commandSelectModel.on('CommandSelect', () => {

            // 次のコマンド選択キャラクターを取得しアイコンを点滅
            this.playerPartyWindow.lightUpDown(this.commandSelectModel.getCurrentCharacter().name);

            this.stateMachine.push('ATTACK_SELECT');
        });

        // 戦闘開始
        this.commandSelectModel.on('CommandSelectFinish', async () => {

            // ターン順を設定
            this.turnModel.setupTurnOrder(this.battleModel.getBattlerList());

            // 0.5秒待機
            await new Promise<void>((resolve) => {
                this.battleScene.time.delayedCall(500, () => {
                    resolve();
                }, [], this.battleScene);
            });

            // 戦闘処理
            this.executor.battle(this.turnModel.getCurrentCharacter());
        });

        // イベントの破棄
        this.commandSelectModel.on('shutdown', () => {
            this.commandSelectModel.off('CommandSelect');
            this.commandSelectModel.off('CommandSelectFinish');
        });
    }

    // 戦闘時のキャラクター毎のターンを管理する
    private setTurnModel() {

        // 次キャラクターのターンへ変更
        this.turnModel.on('TurnChange', (currentActive: Phaser.GameObjects.GameObject) => {
            this.executor.battle(currentActive);
        });

        // 全てのキャラクターのターンが終了
        this.turnModel.on('TurnFinish', () => {

            // 防御をリセット
            this.battleModel.resetBattleStatus();

            // 次のコマンド選択キャラクターをチェック
            this.commandSelectModel.checkNextCommandSelectStartCharacter();

            // オートフラグをリセット
            this.executor.setAutoFlg(false);

            // 最初のコマンドに戻る
            this.stateMachine.push('BATTLE_SELECT');
        });

        // イベントの破棄
        this.turnModel.on('shutdown', () => {
            this.turnModel.off('TurnChange');
            this.turnModel.off('TurnFinish');
        });
    }
}
