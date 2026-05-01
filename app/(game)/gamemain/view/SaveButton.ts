import { GameScene } from "../../lib/types";
import { SaveDataManager } from "../../core/SaveDataManager";
import { MapObject } from "./MapObject";
import { GameStateManager } from "../../GameAllState/GameStateManager";
import { CacheDataUpdate } from "../../core/CacheDataUpdate";

export class SaveButton {
    private saveDataManager: SaveDataManager;

    constructor(
        private gameScene: GameScene,
        private mapObject: MapObject) {
    }

    public async execute() {
        this.createSaveButton();
    }

    //ボタン
    private createSaveButton() {
        this.saveDataManager = new SaveDataManager();

        const gameConfigWidth: number = Number(this.gameScene.game.config.width);
        const gameConfigHeight: number = Number(this.gameScene.game.config.height);

        const MenuText = this.gameScene.add.text(
            gameConfigWidth - 100, gameConfigHeight - 200,
            "SAVE", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        MenuText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        MenuText.setDepth(999999);
        MenuText.setScrollFactor(0);//スクロールに影響されなくなる

        MenuText.setInteractive({
            useHandCursor: true  // マウスオーバーでカーソルが指マークになる
        });

        MenuText.on(Phaser.Input.Events.POINTER_UP, async (
            pointer: Phaser.Input.Pointer,
            localX: number,
            localY: number,
            event: Phaser.Types.Input.EventData) => {

            //effect（パーティクル）
            const emitter = this.gameScene.add.particles(0, 0, 'spark', {
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },
                lifespan: 600,
                gravityY: 300,
                blendMode: 'ADD',
                emitting: false // 最初は出さない
            });
            emitter.setDepth(MenuText.depth + 1);
            emitter.explode(15, pointer.worldX, pointer.worldY);

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            //セーブ前にキャッシュを更新
            //this.phaserCacheDataUpdate();

            const cacheDataUpdate = new CacheDataUpdate(this.gameScene);
            cacheDataUpdate.phaserCacheDataUpdate();

            //セーブ処理
            await this.saveDataManager.setSaveData(this.gameScene);

        });

    }

    // private phaserCacheDataUpdate() {
    //     const manager = GameStateManager.getInstance();
    //     const savedata = this.gameScene.cache.json.get('savedata');
    //     const player = this.mapObject.getPlayer();

    //     savedata.infomation = "中断セーブデータ";
    //     savedata.playerData.PlayerMapKey = manager.currentFieldData.mapKey;
    //     savedata.playerData.PlayerPosition.x = player.x;
    //     savedata.playerData.PlayerPosition.y = player.y;
    //     //savedata.playerData.initStandKey = player.getAnimationKey().standframe;

    //     // ステータスを同期
    //     const status = savedata.playerData.status;
    //     for (const key in status) {
    //         if (player.data.has(key)) {
    //             status[key] = player.data.get(key);
    //         }
    //     }

    //     // アイテムを同期（削除状態を反映）
    //     const items = savedata.playerData.Item;
    //     for (const key in items) {
    //         if (player.data.has(key)) {
    //             items[key] = player.data.get(key);
    //         } else {
    //             // player.data に存在しない（個数0で削除された）場合はセーブデータからも削除
    //             delete items[key];
    //         }
    //     }

    //     // cache.savedataのItemに存在しない項目を追加
    //     for (const key in player.data.list) {
    //         if (!items.hasOwnProperty(key)) {
    //             if (this.saveDataManager.checkItemListData(key)) {
    //                 items[key] = player.data.get(key);
    //             }
    //         }
    //     }
    // }


}