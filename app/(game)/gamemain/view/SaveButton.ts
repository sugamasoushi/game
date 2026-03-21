import { GameScene } from "../../lib/types";
import { SaveDataManager } from "../../core/SaveDataManager";
import { MapObject } from "./MapObject";
import { GameStateManager } from "../../GameAllState/GameStateManager";
import { FieldAttack } from "./character/Action/FieldAttack";

export class SaveButton {
    private saveDataManager: SaveDataManager;
    private fieldAttack: FieldAttack;

    constructor(
        private gameScene: GameScene,
        private mapObject: MapObject) {
    }

    public async execute() {
        this.createTestButton();
    }

    //テスト用のボタン
    private createTestButton() {
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

            //パーティクル
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

            this.setSaveData();

            await this.saveDataManager.setSaveData(this.gameScene);

            //zone.removeInteractive();//クリック後、クリック操作を削除
            console.log(this.gameScene.getPlayer());
            const list: Phaser.GameObjects.GameObject[] = [];
            this.gameScene.children.getChildren().map(obj => {
                if (obj.type === "Sprite") {
                    list.push(obj)
                }
            })
        });

    }

    private setSaveData() {
        const manager = GameStateManager.getInstance();

        this.gameScene.cache.json.get('savedata').infomation = "中断セーブデータ";
        this.gameScene.cache.json.get('savedata').playerData.PlayerMapKey = manager.currentFieldData.mapKey;
        this.gameScene.cache.json.get('savedata').playerData.PlayerPosition.x = this.mapObject.getPlayer().x;
        this.gameScene.cache.json.get('savedata').playerData.PlayerPosition.y = this.mapObject.getPlayer().y;
        this.gameScene.cache.json.get('savedata').playerData.status.HP = this.mapObject.getPlayer().getData('HP');
        this.gameScene.cache.json.get('savedata').playerData.status.MP = this.mapObject.getPlayer().getData('MP');

        this.gameScene.cache.json.get('savedata').playerData.Item['やくそう'] = this.mapObject.getPlayer().getData('やくそう');
    }

}