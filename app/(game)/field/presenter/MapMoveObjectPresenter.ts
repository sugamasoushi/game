import { MapMoveObjectModel } from "../model/MapMoveObjectModel";
import { MapMoveObjectView } from "../view/MapMoveObjectView";
import { FieldScene } from "../../lib/types";
import { GameStateManager } from "../../core/GameStateManager";
import { CharacterState } from "../../lib/FieldTypes";

export class MapMoveObjectPresenter {

    constructor(
        private fieldScene: FieldScene,
        private mapMoveObjectModel: MapMoveObjectModel,
        private mapMoveObjectView: MapMoveObjectView,
        private makeTileMap: Phaser.Tilemaps.Tilemap,
    ) {
    }

    public async execute() {
        this.mapMoveObjectModel.execute();
        this.mapMoveObjectView.execute(this.makeTileMap, this.onMapMove);
    }

    public onMapMove = (
        obj: Phaser.Physics.Arcade.Sprite,
        moveMapKey: string,
        moveMapX: number,
        moveMapY: number,
        initStandKey: string
    ) => {

        const gameStateManager = GameStateManager.getInstance();

        //オブジェクトに衝突したらマップを変更する
        this.fieldScene.physics.add.overlap(gameStateManager.currentPlayerPartyList[0], obj, () => {
            (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える

            //FieldPresenterに通知
            this.fieldScene.events.emit('FIELD_RESTART', {
                gameMode: 'FieldMove',
                mapKey: moveMapKey,
                x: moveMapX,
                y: moveMapY,
                initStandKey: initStandKey
            });

            //キャッシュを更新
            this.mapMoveObjectModel.execCacheData();

            //プレイヤーを停止（FIELD_RESTARTによりプレイヤーが再生成されるため、リセットされる）
            gameStateManager.currentPlayerPartyList[0].state = CharacterState.normal;
            (gameStateManager.currentPlayerPartyList[0] as Phaser.Physics.Arcade.Sprite).setVelocity(0);

        }, undefined, this.fieldScene);

        // シーン終了時にイベントを破棄
        this.fieldScene.events.once('shutdown', () => {
            obj.destroy();
        });
    }


}