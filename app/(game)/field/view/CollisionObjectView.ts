import { ObjState } from "../../lib/FieldTypes";
import { GameStateManager } from "../../core/GameStateManager";
import { EventFlagData } from "../../Data/EventFlagData";

export class CollisionObjectView {

    private collisionObjects: Phaser.Physics.Arcade.Sprite[] = [];

    constructor(private gameScene: Phaser.Scene) { }

    public async execute(makeTileMap: Phaser.Tilemaps.Tilemap) {

        //同じ名前のオブジェクトをまとめて作成する。
        const CollisionObjects = makeTileMap.createFromObjects('COLLISION', {}, false);
        const CollisionObjectsArcadeStaticGroup = this.gameScene.physics.add.staticGroup(CollisionObjects);
        const CollisionObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = CollisionObjectsArcadeStaticGroup.getChildren();
        for (const obj of CollisionObjectStaticGroupChildren) {
            await this.createCollision(obj as Phaser.Physics.Arcade.Sprite);
            this.collisionObjects.push(obj as Phaser.Physics.Arcade.Sprite);
        }
    }

    private createCollision(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {

            const deleteRelationEvent_1 = obj.getData('deleteRelationEvent_1');
            const playerNum = obj.getData('playerNum');

            const gameStateManager = GameStateManager.getInstance();
            //有効状態に設定
            obj.state = ObjState.true;
            obj.setDepth(-100);

            /**
             * イベントが完了していたら判定を消去
             * 
             * ※条件等の処理方法は検討の余地あり
             */
            if (!EventFlagData.getFlag(this.gameScene, deleteRelationEvent_1) &&
                playerNum === gameStateManager.currentPlayerPartyList.length) {
                obj.body!.collisionCategory = 0;//衝突判定のON/OFFを切り替える
            }

            // シーン終了時にイベントを破棄
            this.gameScene.events.once('shutdown', () => {
                obj.destroy();
            });

            resolve();
        });
    }

    public getClickEventObjects(): Phaser.Physics.Arcade.Sprite[] {
        return this.collisionObjects;
    }
}