import { ObjState } from "../../lib/FieldTypes";

export class MapMoveObjectView {

    private mapMoveObjects: Phaser.Physics.Arcade.Sprite[] = [];

    constructor(private fieldScene: Phaser.Scene) { }

    public async execute(makeTileMap: Phaser.Tilemaps.Tilemap, onMapMove: (obj: Phaser.Physics.Arcade.Sprite, moveMapKey: string, moveMapX: number, moveMapY: number, initStandKey: string) => void) {

        //同じ名前のオブジェクトをまとめて作成する。
        const mapMoveObjects = makeTileMap.createFromObjects('MAPMOVE', {}, false);
        const mapMoveObjectsStaticGroup = this.fieldScene.physics.add.staticGroup(mapMoveObjects);
        const mapMoveObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = mapMoveObjectsStaticGroup.getChildren();

        for (const obj of mapMoveObjectStaticGroupChildren) {
            await this.createMapMoveObject(obj as Phaser.Physics.Arcade.Sprite, onMapMove);
            this.mapMoveObjects.push(obj as Phaser.Physics.Arcade.Sprite);
        }
    }

    private createMapMoveObject(
        obj: Phaser.Physics.Arcade.Sprite,
        onMapMove: (obj: Phaser.Physics.Arcade.Sprite, moveMapKey: string, moveMapX: number, moveMapY: number, initStandKey: string) => void
    ) {
        return new Promise<void>(async (resolve) => {

            const tileSize = 2;

            const moveMapKey = obj.getData('moveToMap');
            let moveMapX = obj.getData('moveX');
            let moveMapY = obj.getData('moveY');
            const direction = obj.getData('direction');

            //マップ切り替え時のキャラクター位置調整用
            const moveCorrection = 32 / 2 + 2;

            //初期立ち絵のキー
            let initStandKey = '';

            //有効状態に設定
            obj.state = ObjState.true;

            //非表示
            obj.setVisible(false);

            //移動後の初期位置を補正
            if (direction === "R") {
                moveMapX += moveCorrection;

                //サイズを変更
                obj.body!.setSize(tileSize, obj.body!.height);

                //右向き
                initStandKey = 'stand_right';

            } else if (direction === "L") {
                moveMapX += -(moveCorrection);

                //サイズを変更
                obj.body!.setSize(tileSize, obj.body!.height);

                //左向き
                initStandKey = 'stand_left'

            } else if (direction === "U") {
                moveMapY += -(moveCorrection);

                //サイズを変更
                obj.body!.setSize(obj.body!.width, tileSize);

                //上向き
                initStandKey = 'stand_up'

            } else if (direction === "D") {
                moveMapY += moveCorrection;

                //サイズを変更
                obj.body!.setSize(obj.body!.width, tileSize);

                //右向き
                initStandKey = 'stand_down';
            }

            //オブジェクトに衝突したらマップを変更する
            onMapMove(obj, moveMapKey, moveMapX, moveMapY, initStandKey);

            resolve();
        });
    }
}