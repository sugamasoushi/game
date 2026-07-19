import { FieldScene } from "../lib/SceneTypes";
import { GameStateManager } from "../core/GameStateManager";

export class BubbleTalk extends Phaser.Scene {

    constructor() { super('BubbleTalk'); }

    // init(data: { sceneKey: string }) {
    //     console.log(data.sceneKey)
    // }

    create() {

        //フィールドシーン
        const fieldScene = this.scene.get('Field') as FieldScene;

        //マップ全体のサイズ
        console.log(fieldScene.getMakeTilemap().widthInPixels, fieldScene.getMakeTilemap().heightInPixels)

        const gameStateManager = GameStateManager.getInstance();
        const sprite = gameStateManager.currentPlayerPartyList[0];

        //フィールドシーンのカメラを取得
        const fieldSceneCamera = fieldScene.cameras.main;
        console.log(fieldSceneCamera.scrollX, fieldSceneCamera.scrollY)

        const screenX = sprite.x - fieldSceneCamera.scrollX;
        const screenY = sprite.y - fieldSceneCamera.scrollY;

        //座標を変換
        console.log(screenX, screenY);

    }

}
