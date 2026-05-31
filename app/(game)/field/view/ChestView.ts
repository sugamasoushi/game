import { MapLayerDepth } from "../../lib/FieldTypes";

export class ChestView {

    private chestSpriteObjects: Phaser.Physics.Arcade.Sprite[] = [];

    constructor(private gameScene: Phaser.Scene) { }

    public async execute(makeTileMap: Phaser.Tilemaps.Tilemap, execOpenChest: (obj: Phaser.Physics.Arcade.Sprite) => void) {

        //同じ名前のオブジェクトをまとめて作成する。
        const chestSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
            name: 'chest',  // Tiledでオブジェクトに付けた「名前」を指定
            key: 'tex_Chests' // ロード済みのspritesheetKey
        });
        const chestSpriteObjectsArcadeStaticGroup: Phaser.Physics.Arcade.StaticGroup = this.gameScene.physics.add.staticGroup(chestSpriteObjects);
        const chestSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = chestSpriteObjectsArcadeStaticGroup.getChildren();

        for (const obj of chestSpriteObjectStaticGroupChildren) {
            await this.createChestSpriteObject(obj as Phaser.Physics.Arcade.Sprite, 'tex_Chests', execOpenChest);
            this.chestSpriteObjects.push(obj as Phaser.Physics.Arcade.Sprite);
        }
    }

    private createChestSpriteObject(
        obj: Phaser.Physics.Arcade.Sprite,
        imageKey: string,
        execOpenChest: (obj: Phaser.Physics.Arcade.Sprite) => void) {

        return new Promise<void>(async (resolve) => {

            // id無し宝箱はランダム生成
            if (obj.getData('id') == null) {
                if (new Phaser.Math.RandomDataGenerator().between(0, 2) >= 1) {
                    obj.destroy();
                    resolve();
                    return;
                }
            }

            // //深度設定
            obj.setDepth(MapLayerDepth.Highest + obj.y);
            //obj.setPipeline('Light2D');

            //アニメーション設定
            obj.anims.create({
                key: 'chest_open',
                frames: this.gameScene.anims.generateFrameNumbers(imageKey, { start: 4, end: 4 }),
                frameRate: 1,
                repeat: 0
            });
            obj.anims.create({
                key: 'chest_close',
                frames: this.gameScene.anims.generateFrameNumbers(imageKey, { start: 0, end: 0 }),
                frameRate: 1,
                repeat: 0
            });

            //配置時の状態設定
            const boxId = obj.getData('id');
            if (boxId != null && this.gameScene.cache.json.get('savedata').itemboxFlg[boxId] === 0) {
                obj.play('chest_open');
            } else {

                //クリック可能にする
                obj.setInteractive({ useHandCursor: true });

                // //クリックイベント
                obj.on('pointerdown', async () => {
                    execOpenChest(obj);
                })

                // シーン終了時にイベントを破棄
                this.gameScene.events.once('shutdown', () => {
                    obj.destroy();
                });
            }

            resolve();
        });
    }

    public getChestSpriteObjects(): Phaser.Physics.Arcade.Sprite[] {
        return this.chestSpriteObjects;
    }

}