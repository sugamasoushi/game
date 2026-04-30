import { GameScene, State } from "../../lib/types";
import { FieldMapModel } from "../model/FieldMapModel";
import { TileMap } from "../view/TileMap";
import { MapObject } from "../view/MapObject";
import { MenuButton } from "../view/MenuButton";
import { SaveButton } from "../view/SaveButton";
import { FireButton } from "../view/FireButton";
import { FieldData } from "../../lib/types";
import { GameStateManager } from "../../GameAllState/GameStateManager";
import { Npc } from "../view/character/Npc";
import { Player } from "../view/character/Player";

import { Subscription } from "rxjs";
import { InputManager } from "../../core/input/InputManager";
import { CameraManager } from "../view/CameraManager";
import { FieldMessageWindow } from "../view/FieldMessageWindow";

export class FieldPresenter {
    private subs = new Subscription(); // 購読をまとめる箱

    constructor(
        private gameScene: GameScene,
        private fieldMapModel: FieldMapModel,
        private tileMap: TileMap,
        private mapObject: MapObject,
        private menuButton: MenuButton,
        private saveButton: SaveButton,
        private fireButton: FireButton,
        private cameraManager: CameraManager,
        private inputManager: InputManager,
        private fieldMessageWindow: FieldMessageWindow
    ) {
        this.gameScene = gameScene;
        this.fieldMapModel = fieldMapModel;
        this.tileMap = tileMap;
        this.mapObject = mapObject;
        this.menuButton = menuButton;
        this.saveButton = saveButton;
        this.fireButton = fireButton;
        this.cameraManager = cameraManager;
        this.inputManager = inputManager;
        this.fieldMessageWindow = fieldMessageWindow;
    }

    public async create(sceneKey: string) {
        //this.cameraManager.getMainCamera().setZoom(1.2);

        //マップ情報の判定、検索処理とか実装する必要がある
        if (this.fieldMapModel.getFieldData().mapKey === '0102') {
            this.gameScene.game.events.emit('BGM_FIELD', sceneKey, 'waterFall');
        } else {
            this.gameScene.game.events.emit('BGM_FIELD', sceneKey, '');
        }

        // イベントエミッター設定
        this.setEventEmitter();

        //シーン開始時にフェードイン
        if (sceneKey !== 'menu') { this.cameraManager.execFadeIn(); }

        //マップやオブジェクトを作成
        this.tileMap.execute(this.fieldMapModel.getFieldData());
        this.mapObject.execute(this.gameScene.events, this.tileMap, this.fieldMapModel.getFieldData());
        this.menuButton.execute();
        this.saveButton.execute();
        this.fireButton.execute();
        this.fieldMessageWindow.init();

        //オブジェクト作成、各種設定
        this.inputManager.execute();
        this.cameraManager.execute(this.tileMap.getMakeTilemap(), this.mapObject.getPlayer());
        this.fieldMapModel.execute(this.mapObject);
    }

    private setEventEmitter() {
        //状態管理クラス
        const gameStateManager = GameStateManager.getInstance();

        //フェード後、入力設定
        this.gameScene.events.once('FADE_IN_COMPLETE', () => {
            if (gameStateManager.currentState !== State.EVENT) {
                this.inputManager.setState(true);
            }
        });

        this.gameScene.events.on('FREE_MESSAGE_WINDOW', (message: string, time: number) => {
            this.fieldMessageWindow.messageOutput(message, time);
        });

        //フィールドの入力はオブジェクト毎に制御したいため、scene.input.enabledは使用せず、オブジェクト毎のフラグ管理としている
        this.gameScene.events.on('GAME_INPUT_TRUE', () => {
            this.inputManager.setState(true);
        });
        this.gameScene.events.on('GAME_INPUT_FALSE', () => { this.inputManager.setState(false); });

        this.gameScene.events.on('FIELD_RESTART', (fieldData: FieldData) => {

            this.inputManager.setState(false);

            //状態更新
            gameStateManager.updateState({
                state: State.FIELD_RESTART,
                fieldData: {
                    gameMode: fieldData.gameMode,
                    mapKey: fieldData.mapKey,
                    x: fieldData.x,
                    y: fieldData.y,
                    x2: fieldData.x2,
                    y2: fieldData.y2,
                    initStandKey: fieldData.initStandKey,
                }
            }, 'FieldMove');

        })

        this.gameScene.events.on('EVENT_START', (eventObj: Phaser.Physics.Arcade.Sprite) => {

            //カメラ設定
            this.cameraManager.setFollow(false);

            //入力不可設定
            this.inputManager.setState(false);

            //状態更新
            gameStateManager.updateState({
                state: State.EVENT,
                eventObj: eventObj
            }, 'Event');
        });

        this.gameScene.events.on('EVENT_END', (notFade: boolean) => {
            console.log('EVENT_END')

            this.inputManager.setState(true);
            this.cameraManager.setFollow(true);//カメラ設定

            gameStateManager.updateState({
                state: State.NOSTATE,
            }, 'EventEnd');

            if (notFade) { return }
            this.cameraManager.execFadeIn();
        });

        this.gameScene.events.on('BATTLE', (battleData: { usePatern: string, fieldHitEnemy: Npc, canNotRunaway: boolean }) => {

            //戦闘開始時に停止
            for (const sprite of gameStateManager.currentPlayerPartyList) {
                console.log(sprite);
                (sprite as Player).stopAnimation();
                (sprite as Player).setVelocity(0);//念のため
            }

            //状態更新
            gameStateManager.updateState({
                state: State.BATTLE,
                battleData: { usePatern: battleData.usePatern, fieldHitEnemy: battleData.fieldHitEnemy, canNotRunaway: battleData.canNotRunaway }
            }, battleData.usePatern);

        });

        // シーン終了時にイベントを破棄
        //適切に破棄しないとエミッターが残り続け、次回描画時にエラーとなる
        this.gameScene.events.once('shutdown', () => {
            //this.gameScene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE);
            this.gameScene.events.off('FADE_IN_COMPLETE');
            this.gameScene.events.off('FADE_OUT_COMPLETE');
            this.gameScene.events.off('GAME_INPUT_TRUE');
            this.gameScene.events.off('GAME_INPUT_FALSE');
            this.gameScene.events.off('FIELD_RESTART');
            this.gameScene.events.off('EVENT');
            this.gameScene.events.off('EVENT_END');
            this.gameScene.events.off('BATTLE');
            this.gameScene.events.off('FREE_MESSAGE_WINDOW');
            this.subs.unsubscribe();
            this.inputManager.destroy();
        });
    }

    public getPlayer() {
        return this.mapObject.getPlayer();
    }

    public getPlayerPartyList() {
        const gameStateManager = GameStateManager.getInstance();
        return gameStateManager.currentPlayerPartyList;
    }

    public getTilemap(): TileMap {
        return this.tileMap;
    }


}