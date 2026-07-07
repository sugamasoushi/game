import { BattleScene } from "../../lib/types";
import { CommandSelectModel } from "../model/CommandSelectModel";
import { BattleMessageWindow } from "../view/BattleMessageWindow";
import { PlayerPartyWindow } from "../view/PlayerPartyWindow";

import { ItemUpdate } from "../../Data/ItemUpdate";
import { BattleExecutor } from "./BattleExecutor";

// Sceneレベルのイベント配線とアイテム使用処理を担う
export class BattleSceneEventBinder {
    constructor(
        private battleScene: BattleScene,
        private commandSelectModel: CommandSelectModel,
        private battleMessageWindow: BattleMessageWindow,
        private playerPartyWindow: PlayerPartyWindow,
        private executor: BattleExecutor
    ) { }

    // Sceneのイベントリスナーを登録
    public setup() {

        // メッセージの出力
        this.battleScene.events.on('BATTLE_MESSAGE_OUTPUT', async (text: string, waitTime: number) => {
            await this.battleMessageWindow.messageOutput(text, waitTime);
        });

        // 味方のコマンド選択キャラクターアイコンを点滅
        this.battleScene.events.on('PLAYER_ICON_LIGHTUP', (name: string) => {
            this.playerPartyWindow.lightUp(name);
        });

        // 味方のコマンド選択キャラクターアイコンを消灯
        this.battleScene.events.on('PLAYER_ICON_LIGHTDOWN', (name: string) => {
            this.playerPartyWindow.lightDown(name);
        });

        // オート選択
        this.battleScene.events.on('AUTO_BATTLE_SELECT', (autoFlg: boolean) => {
            this.executor.setAutoFlg(autoFlg);
            this.commandSelectModel.emit('CommandSelectFinish');
        });

        this.battleScene.events.on('USE_ITEM', this.onUseItem, this);

        // イベントの破棄
        this.battleScene.events.on('shutdown', () => {
            this.battleScene.events.off('BATTLE_MESSAGE_OUTPUT');
            this.battleScene.events.off('PLAYER_ICON_LIGHTUP');
            this.battleScene.events.off('PLAYER_ICON_LIGHTDOWN');
            this.battleScene.events.off('AUTO_BATTLE_SELECT');
        });
    }

    // アイテム使用
    private onUseItem(itemName: string, count: number, memberIndex: number = 0) {
        const itemUpdate = new ItemUpdate(this.battleScene);
        itemUpdate.useItem(itemName, count, memberIndex);
    }
}
