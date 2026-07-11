import { EventFlagData } from "../../Data/EventFlagData";
import { EventObjState } from "../../lib/FieldTypes";
import { GameStateManager } from "../../core/GameStateManager";

export class EventObjectView {

    constructor(private gameScene: Phaser.Scene) { }

    public async execute(makeTileMap: Phaser.Tilemaps.Tilemap) {

        //同じ名前のオブジェクトをまとめて作成する。
        const eventObjects = makeTileMap.createFromObjects('EVENT', {}, false);
        const eventObjectsStaticGroup = this.gameScene.physics.add.staticGroup(eventObjects);
        const eventObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = eventObjectsStaticGroup.getChildren();
        for (const obj of eventObjectStaticGroupChildren) {
            await this.createEventObject(obj as Phaser.Physics.Arcade.Sprite);
        }
    }

    private createEventObject(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {

            const gameStateManager = GameStateManager.getInstance();
            //状態設定
            obj.state = EventFlagData.getFlag(this.gameScene, obj.name);

            obj.setDepth(-1000);

            //イベントステータスがfalseの場合
            if (obj.state === EventObjState.false) {

                //衝突判定をOFF
                (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える
            }

            //高さを設定（phaserで自動的に32に補正される模様）
            obj.displayHeight = 1;

            //オブジェクトに衝突した場合、イベントを発生させる
            this.gameScene.physics.add.world.addCollider(gameStateManager.currentPlayerPartyList[0], obj, () => {

                this.gameScene.events.emit('EVENT_START', obj)

            }, undefined, this.gameScene);

            if (this.gameScene.physics.world.defaults.debugShowBody === false) {
                obj.setVisible(false);
            }

            // シーン終了時にイベントを破棄
            this.gameScene.events.once('shutdown', () => {
                obj.destroy();
            });

            resolve();
        });
    }
}