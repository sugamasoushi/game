import { ChestModel } from "../model/ChestModel";
import { ChestView } from "../view/ChestView";
import { InputManager } from "../../core/input/InputManager";
import { Player } from "../../field/view/character/Player";

import { BaseSprite } from "../../core/BaseSprite";
import { CharacterState } from "../../lib/FieldTypes";
import { State } from "../../lib/types";
import { FieldObjectCheck } from "../../util/FieldObjectCheck";
import { FieldScene } from "../../lib/types";
import { Sound } from "../../scenes/Sound";

import { Subscription } from "rxjs";
import { GameStateManager } from "../../core/GameStateManager";

export class ChestPresenter {

    private subs = new Subscription();
    private soundScene: Sound;

    constructor(
        private fieldScene: FieldScene,
        private chestModel: ChestModel,
        private chestView: ChestView,
        private makeTileMap: Phaser.Tilemaps.Tilemap,
        private inputManager: InputManager
    ) {
        this.chestModel = new ChestModel(fieldScene);
        this.chestView = new ChestView(fieldScene);

        this.soundScene = this.fieldScene.scene.get('Sound') as Sound;
    }

    public async execute() {
        this.chestModel.execute();
        this.chestView.execute(this.makeTileMap, this.execOpenChest);
        this.setCollision();
        this.setupInput();
    }

    private setCollision() {
        const gameStateManager = GameStateManager.getInstance();
        const chests = this.chestView.getChestSpriteObjects();

        // //衝突判定の追加
        for (const player of gameStateManager.currentPlayerPartyList) {
            this.fieldScene.physics.add.collider(player, chests);
        }
    }

    private setupInput() {
        this.subs.add(this.inputManager.decideButton$.subscribe(() => {

            //操作ロックされている場合、何もしない
            const gameStateManager = GameStateManager.getInstance();
            if (gameStateManager.currentState !== State.NOSTATE) return;


            //宝箱を開ける
            for (const obj of this.chestView.getChestSpriteObjects()) {
                if (Phaser.Geom.Intersects.RectangleToRectangle(obj.getBounds(), gameStateManager.currentPlayerPartyList[0].getBounds())) {
                    this.execOpenChest(obj);
                }
            }
        }));

        this.fieldScene.events.once('shutdown', () => {
            this.subs.unsubscribe();
        });
    }

    private execOpenChest = (obj: Phaser.Physics.Arcade.Sprite) => {

        const gameStateManager = GameStateManager.getInstance();
        const playerPartyList = gameStateManager.currentPlayerPartyList;
        const player = playerPartyList[0] as Player;

        //アイテムが0の場合は処理しない
        if (obj.getData('num') <= 0) return;

        //配置時のフラグが0だった場合は処理しない
        const boxId = obj.getData('id');
        if (boxId != null && this.fieldScene.cache.json.get('savedata').itemboxFlg[boxId] === 0) { return; }

        //プレイヤーとの距離が近い場合
        if (Phaser.Math.Difference(obj.x, player.x) < 40 && Phaser.Math.Difference(obj.y, player.y) < 40) {

            const getItemName = obj.getData('item');
            const getItemNum = obj.getData('num');
            const bubbleTalkKey = obj.getData('bubbleTalkDefaultKey');

            //プレイヤーとオブジェクトのチェック
            const fieldPlayerChk = new FieldObjectCheck(player, obj as BaseSprite);

            //キャラ向きとオブジェクト位置からイベント発生可否をチェック
            if (fieldPlayerChk.checkPlayerClickEvent()) {

                for (const player of playerPartyList) {
                    player.state = CharacterState.event;
                    (player as Phaser.Physics.Arcade.Sprite).setVelocity(0);
                }

                //メッセージ表示
                new Promise<void>(resolve => {
                    const time = 1500
                    this.fieldScene.time.delayedCall(time, () => {

                        //待機時間後、吹き出しメッセージがある場合は開始
                        if (bubbleTalkKey) {
                            gameStateManager.updateState({ state: State.BUBBLE_TALK, eventObj: obj }, bubbleTalkKey);
                        }

                        this.fieldScene.events.emit('GAME_INPUT_TRUE');

                        for (const player of playerPartyList) { player.state = CharacterState.normal; }
                        resolve();

                    }, [], this.fieldScene);
                    this.fieldScene.events.emit('GAME_INPUT_FALSE');
                    const uiScene = this.fieldScene.scene.get('UI');
                    uiScene.events.emit('UI_FREE_MESSAGE_WINDOW', getItemName + 'を' + getItemNum + '個手に入れた！', time);
                });

                obj.play('chest_open');
                this.soundScene.playSe('SE_chestOpen');

                //プレイヤーの持ち物を更新
                player.stopAnimation();

                //アイテムを持ってない場合、初期化
                if (!player.getData(getItemName)) {
                    player.setData(getItemName, 0);
                }
                player.data.values[getItemName] += getItemNum;

                //idが存在する場合はキャッシュのフラグを更新
                if (obj.getData('id') !== null) {
                    this.fieldScene.cache.json.get('savedata').itemboxFlg[obj.getData('id')] = 0;
                }

                //個数を更新
                obj.setData('num', 0);

                //キャッシュを更新
                this.chestModel.execCacheData();

                //オブジェクトのインタラクティブを無効化
                obj.setInteractive({ useHandCursor: false });
                obj.off('pointerdown');
            }
        }

    }

}