import { State } from "../../lib/types";
import { ClickEventObjectModel } from "../model/ClickEventObjectModel";
import { ClickEventObjectView } from "../view/ClickEventObjectView";
import { FieldScene } from "../../lib/types";
import { GameStateManager } from "../../core/GameStateManager";
import { FieldObjectCheck } from "../../util/FieldObjectCheck";

import { Subscription } from "rxjs";
import { InputManager } from "../../core/input/InputManager";
import { Player } from "../view/character/Player";

export class ClickEventObjectPresenter {

    private subs = new Subscription();

    constructor(
        private fieldScene: FieldScene,
        private clickEventObjectModel: ClickEventObjectModel,
        private clickEventObjectView: ClickEventObjectView,
        private makeTileMap: Phaser.Tilemaps.Tilemap,
        private inputManager: InputManager
    ) {
        this.clickEventObjectModel = new ClickEventObjectModel(this.fieldScene);
        this.clickEventObjectView = new ClickEventObjectView(this.fieldScene);
    }

    public async execute() {

        this.clickEventObjectModel.execute();
        this.clickEventObjectView.execute(this.makeTileMap, this.execClickEvent);

        this.setupInput();
    }

    private setupInput() {
        this.subs.add(this.inputManager.decideButton$.subscribe(() => {

            //操作ロックされている場合、何もしない
            const gameStateManager = GameStateManager.getInstance();
            if (gameStateManager.currentState !== State.NOSTATE) return;


            //クリックイベント
            for (const obj of this.clickEventObjectView.getClickEventObjects()) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(obj.getBounds(), gameStateManager.currentPlayerPartyList[0].getBounds())) {
                    this.execClickEvent(obj);
                }
            }
        }));

        this.fieldScene.events.once('shutdown', () => {
            this.subs.unsubscribe();
        });
    }

    private execClickEvent = (obj: Phaser.Physics.Arcade.Sprite) => {

        //状態管理クラス
        const gameStateManager = GameStateManager.getInstance();
        const player = gameStateManager.currentPlayerPartyList[0] as Player;

        //操作ロックされている場合、何もしない
        if (gameStateManager.currentState !== State.NOSTATE) return;

        //吹き出し会話を設定
        const bubbleTalkKey = obj.getData('bubbleTalkDefaultKey');

        //プレイヤーとオブジェクトのチェック
        const fieldPlayerChk = new FieldObjectCheck(player, obj as Phaser.Physics.Arcade.Sprite);

        //キャラ向きとオブジェクト位置からイベント発生可否をチェック
        if (fieldPlayerChk.checkPlayerClickEvent()) {
            gameStateManager.updateState({ state: State.BUBBLE_TALK, eventObj: obj }, bubbleTalkKey);
        }
    }

}