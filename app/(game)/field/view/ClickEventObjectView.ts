import { ObjState } from "../../lib/FieldTypes";
import { GameStateManager } from "../../core/GameStateManager";
import { Player } from "./character/Player";

export class ClickEventObjectView {

    private clickEventObjects: Phaser.Physics.Arcade.Sprite[] = [];

    constructor(private gameScene: Phaser.Scene) { }

    public async execute(makeTileMap: Phaser.Tilemaps.Tilemap, execClickEvent: (obj: Phaser.Physics.Arcade.Sprite) => void) {

        //同じ名前のオブジェクトをまとめて作成する。
        const clickEventObjects = makeTileMap.createFromObjects('CLICKEVENT', {}, false);
        const clickEventObjectsArcadeStaticGroup = this.gameScene.physics.add.staticGroup(clickEventObjects);
        const clickEventObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = clickEventObjectsArcadeStaticGroup.getChildren();
        for (const obj of clickEventObjectStaticGroupChildren) {
            await this.createClickEventObject(obj as Phaser.Physics.Arcade.Sprite, execClickEvent);
            this.clickEventObjects.push(obj as Phaser.Physics.Arcade.Sprite);
        }
    }

    private createClickEventObject(obj: Phaser.Physics.Arcade.Sprite, execClickEvent: (obj: Phaser.Physics.Arcade.Sprite) => void) {
        return new Promise<void>(async (resolve) => {

            const gameStateManager = GameStateManager.getInstance();

            //有効状態に設定
            obj.state = ObjState.true;

            obj.setInteractive({ useHandCursor: true });//クリック可能にする
            //objectArray.setDepth(-1000);

            obj.on('pointerdown', () => {
                (gameStateManager.currentPlayerPartyList[0] as Player).stopAnimation();
                if (Phaser.Math.Difference(obj.x, (gameStateManager.currentPlayerPartyList[0] as Player).x) < 40 && Phaser.Math.Difference(obj.y, (gameStateManager.currentPlayerPartyList[0] as Player).y) < 40) {

                    execClickEvent(obj);
                }
            })

            obj.setDepth(-100);

            // シーン終了時にイベントを破棄
            this.gameScene.events.once('shutdown', () => {
                obj.destroy();
            });

            resolve();
        });
    }

    public getClickEventObjects(): Phaser.Physics.Arcade.Sprite[] {
        return this.clickEventObjects;
    }
}