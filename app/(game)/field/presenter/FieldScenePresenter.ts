import { FieldScene, BgmState, State } from "../../lib/types";
import { FieldSceneModel } from "../model/FieldSceneModel";
import { TileMap } from "../view/TileMap";

import { MapObject } from "../view/MapObject";
import { MapEffect } from "../view/MapEffect";

import { FieldData } from "../../lib/types";
import { GameStateManager } from "../../core/GameStateManager";

import { Subscription } from "rxjs";
import { InputManager } from "../../core/input/InputManager";
import { CameraManager } from "../view/CameraManager";
import { FieldMessageWindow } from "../view/FieldMessageWindow";

import { PlayerModel } from "../model/PlayerModel";
import { PlayerView } from "../view/PlayerView";
import { PlayerPresenter } from './PlayerPresenter';
import { Player } from "../view/character/Player";

import { NpcModel } from "../model/NpcModel";
import { NpcView } from "../view/NpcView";
import { NpcPresenter } from './NpcPresenter';
import { Npc } from "../view/character/Npc";

import { ChestModel } from "../model/ChestModel";
import { ChestView } from "../view/ChestView";
import { ChestPresenter } from './ChestPresenter';

import { MapMoveObjectModel } from "../model/MapMoveObjectModel";
import { MapMoveObjectView } from "../view/MapMoveObjectView";
import { MapMoveObjectPresenter } from "./MapMoveObjectPresenter";

import { EventObjectPresenter } from "./EventObjectPresenter";
import { EventObjectView } from "../view/EventObjectView";
import { EventObjectModel } from "../model/EventObjectModel";

import { ClickEventObjectPresenter } from "./ClickEventObjectPresenter";
import { ClickEventObjectView } from "../view/ClickEventObjectView";
import { ClickEventObjectModel } from "../model/ClickEventObjectModel";

import { CollisionObjectPresenter } from "./CollisionObjectPresenter";
import { CollisionObjectView } from "../view/CollisionObjectView";
import { CollisionObjectModel } from "../model/CollisionObjectModel";

import { TestButton } from "../view/TestButton";

export class FieldScenePresenter {
    private subs = new Subscription(); // 購読をまとめる箱
    private uiScene: Phaser.Scene;

    private tileMap: TileMap;
    private mapObject: MapObject;
    private mapEffect: MapEffect;

    private playermodel: PlayerModel;
    private playerView: PlayerView;
    private playerPresenter: PlayerPresenter;

    private npcView: NpcView;
    private npcModel: NpcModel;
    private npcPresenter: NpcPresenter;

    private mapMoveObjectModel: MapMoveObjectModel;
    private mapMoveObjectView: MapMoveObjectView;
    private mapMoveObjectPresenter: MapMoveObjectPresenter;

    private eventObjectModel: EventObjectModel;
    private eventObjectView: EventObjectView;
    private eventObjectPresenter: EventObjectPresenter;

    private clickEventObjectModel: ClickEventObjectModel;
    private clickEventObjectView: ClickEventObjectView;
    private clickEventObjectPresenter: ClickEventObjectPresenter;

    private chestModel: ChestModel;
    private chestView: ChestView;
    private chestPresenter: ChestPresenter;

    private collisionObjectPresenter: CollisionObjectPresenter;
    private collisionObjectView: CollisionObjectView;
    private collisionObjectModel: CollisionObjectModel;

    constructor(
        private fieldScene: FieldScene,
        private fieldSceneModel: FieldSceneModel,
        private cameraManager: CameraManager,
        private inputManager: InputManager,
        private fieldMessageWindow: FieldMessageWindow
    ) {
        this.fieldScene = fieldScene;
        this.fieldSceneModel = fieldSceneModel;

        this.fieldSceneModel.execute();

        this.cameraManager = cameraManager;
        this.inputManager = inputManager;
        this.fieldMessageWindow = fieldMessageWindow;

        this.uiScene = this.fieldScene.scene.get('UI') as Phaser.Scene;
    }

    public update(time: number, delta: number) {
        if (this.playerPresenter) { this.playerPresenter.update(time, delta); }
        if (this.playerView) { this.playerView.update(time, delta); }
        if (this.npcPresenter) { this.npcPresenter.update(time, delta); }
        if (this.npcView) { this.npcView.update(time, delta); }
        if (this.mapEffect) { this.mapEffect.update(time, delta); }
    }

    public async execute(sceneKey: string) {
        console.log("FieldPresenter")

        //this.cameraManager.getMainCamera().setZoom(1.2);
        // this.cameraManager.getMainCamera().postFX.addTiltShift(
        //     0.5,//radius: ボケ効果の半径。デフォルト値は 0.5。
        //     0.5,//amount: ボケ効果の量。デフォルト値は 1。 
        //     0.1,//contrast: ボケ効果の色のコントラスト。デフォルト値は 0.2
        //     0.5,//blurX水平方向のぼかしの量。 
        //     0.5,//blurY垂直方向のぼかしの量。 
        //     0.5//strengthぼかしの強さ。 
        // );

        const gameStateManager = GameStateManager.getInstance();

        if (gameStateManager.isDebugMode) {
            const testbutton = new TestButton(this.fieldScene);
            testbutton.execute();
        }

        //現在のBGM状態を更新
        // gameStateManager.setBgmState(BgmState.FIELD);
        gameStateManager.updateState({ bgmState: BgmState.FIELD }, 'sound');

        //view-------------------------------------------------
        //console.log("タイルセットのロードを開始します...");
        this.tileMap = new TileMap(this.fieldScene, this.fieldSceneModel.getMakeTilemapData());
        await this.tileMap.loadTileSetFile(gameStateManager.currentFieldData);
        await this.tileMap.execute();

        this.playerPresenter = new PlayerPresenter(
            this.fieldScene,
            this.playermodel,
            this.playerView,
            this.tileMap,
            this.inputManager);
        await this.playerPresenter.execute();

        this.npcPresenter = new NpcPresenter(
            this.fieldScene,
            this.npcModel,
            this.npcView,
            this.tileMap,
            this.inputManager);
        await this.npcPresenter.execute();

        //マップ移動オブジェクトが存在する場合はMVPを生成
        if (this.fieldSceneModel.mapMoveFlg) {
            this.mapMoveObjectPresenter = new MapMoveObjectPresenter(
                this.fieldScene,
                this.mapMoveObjectModel,
                this.mapMoveObjectView,
                this.tileMap.getMakeTilemap());

            await this.mapMoveObjectPresenter.execute();
        }

        //イベントオブジェクトが存在する場合はMVPを生成
        if (this.fieldSceneModel.eventObjectFlg) {
            this.eventObjectPresenter = new EventObjectPresenter(
                this.fieldScene,
                this.eventObjectModel,
                this.eventObjectView,
                this.tileMap.getMakeTilemap());

            await this.eventObjectPresenter.execute();
        }

        //クリックイベントオブジェクトが存在する場合はMVPを生成
        if (this.fieldSceneModel.clickEventObjectFlg) {
            this.clickEventObjectPresenter = new ClickEventObjectPresenter(
                this.fieldScene,
                this.clickEventObjectModel,
                this.clickEventObjectView,
                this.tileMap.getMakeTilemap(),
                this.inputManager);

            await this.clickEventObjectPresenter.execute();
        }

        //宝箱が存在する場合はMVPを生成
        if (this.fieldSceneModel.chestFlg) {
            this.chestPresenter = new ChestPresenter(
                this.fieldScene,
                this.chestModel,
                this.chestView,
                this.tileMap.getMakeTilemap(),
                this.inputManager);

            await this.chestPresenter.execute();
        }

        //オブジェクトの衝突オブジェクトが存在する場合はMVPを生成
        if (this.fieldSceneModel.collisionObjectFlg) {
            this.collisionObjectPresenter = new CollisionObjectPresenter(
                this.fieldScene,
                this.collisionObjectModel,
                this.collisionObjectView,
                this.tileMap.getMakeTilemap());

            await this.collisionObjectPresenter.execute();
        }

        //mapObjectはテスト用になった
        this.mapObject = new MapObject(this.fieldScene);
        await this.mapObject.execute(this.tileMap);

        //エフェクト作成
        this.mapEffect = new MapEffect(this.fieldScene, this.tileMap, this.tileMap.getTileMapPropatiesEntity());
        await this.mapEffect.execute();

        this.fieldMessageWindow.init();

        //view-------------------------------------------------




        //各種設定
        this.cameraManager.execute(this.tileMap.getMakeTilemap());
        this.cameraManager.setTiledMapPropatiesEntity(this.tileMap.getTileMapPropatiesEntity());
        this.cameraManager.execCameraEffect();

        // イベントエミッター設定
        this.setGameEvent();

        //シーン開始時にフェードイン
        if (sceneKey !== 'menu') {
            this.cameraManager.execFadeInStart();
            this.cameraManager.execFadeIn();
        }

        this.fieldScene.game.events.emit('FIELD_LOADED_COMPLETE');
    }

    private setGameEvent() {
        //状態管理クラス
        const gameStateManager = GameStateManager.getInstance();

        //フェードイン開始
        this.fieldScene.events.once('FADE_IN_START', () => {

            //uiにフェードイン開始を通知
            this.uiScene.events.emit('UI_FADEIN_START');
        });

        //フェード後、入力設定
        this.fieldScene.events.once('FADE_IN_COMPLETE', () => {
            if (gameStateManager.currentState !== State.EVENT) {
                this.inputManager.setState(true);

                // フィールド遷移完了後、イベント中でなければ通常状態へ
                if (gameStateManager.currentState === State.FIELD) {
                    gameStateManager.updateState({ state: State.NOSTATE }, 'FieldReady');
                }
            }
        });

        //フェードアウト開始
        this.fieldScene.events.once('FADE_OUT_START', () => {

            //uiにフェードアウト開始を通知
            this.uiScene.events.emit('UI_FADEOUT_START');
        });

        //自由メッセージ
        this.fieldScene.events.on('FREE_MESSAGE_WINDOW', (message: string, time: number) => {
            this.fieldMessageWindow.messageOutput(message, time);
        });

        //フィールドの入力はオブジェクト毎に制御したいため、scene.input.enabledは使用せず、オブジェクト毎のフラグ管理としている
        this.fieldScene.events.on('GAME_INPUT_TRUE', () => {
            this.inputManager.setState(true);
        });
        this.fieldScene.events.on('GAME_INPUT_FALSE', () => { this.inputManager.setState(false); });

        this.fieldScene.events.on('FIELD_RESTART', async (fieldData: FieldData, key: string) => {

            this.inputManager.setVirtualPadDirectionNull();
            this.inputManager.setState(false);

            if (key !== "EventEndRestart") {
                await this.cameraManager.execFadeOut();
            }

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

            this.inputManager.setState(true);

            //フェードアウトとして使用する
            this.uiScene.events.emit('UI_FADEOUT_START');

            //状態更新
            gameStateManager.updateState({ state: State.NOSTATE }, 'NoState');

        })

        this.fieldScene.events.on('EVENT_START', (eventObj: Phaser.Physics.Arcade.Sprite) => {

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

        this.fieldScene.events.on('EVENT_END', (notFade: boolean) => {
            console.log('EVENT_END')

            // 入力マネージャーのターゲットをGameシーンに戻してから有効化
            InputManager.getInstance(this.fieldScene).setState(true);
            this.cameraManager.setFollow(true);//カメラ設定

            gameStateManager.updateState({
                state: State.NOSTATE,
            }, 'EventEnd');

            if (notFade) { return }
            this.cameraManager.execFadeIn();
        });

        this.fieldScene.events.on('BATTLE', (battleData: { usePatern: string, fieldHitEnemy: Npc, canNotRunaway: boolean }) => {

            //戦闘開始時に停止
            for (const sprite of gameStateManager.currentPlayerPartyList) {
                // console.log(sprite);
                (sprite as Player).stopAnimation();
                (sprite as Player).setVelocity(0);//念のため
            }

            //状態更新
            gameStateManager.updateState({
                state: State.BATTLE,
                battleData: { usePatern: battleData.usePatern, fieldHitEnemy: battleData.fieldHitEnemy, canNotRunaway: battleData.canNotRunaway }
            }, battleData.usePatern);

        });

        this.fieldScene.events.on('CAMERA_BLUR', () => {
            this.cameraManager.cameraBlur();
        });

        this.fieldScene.events.on('CAMERA_NORMAL_EFFECT', () => {
            this.cameraManager.execCameraEffect();
        });

        // シーン終了時にイベントを破棄
        //適切に破棄しないとエミッターが残り続け、次回描画時にエラーとなる
        this.fieldScene.events.once('shutdown', () => {
            //this.fieldScene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE);
            this.fieldScene.events.off('FADE_IN_COMPLETE');
            this.fieldScene.events.off('FADE_OUT_COMPLETE');
            this.fieldScene.events.off('GAME_INPUT_TRUE');
            this.fieldScene.events.off('GAME_INPUT_FALSE');
            this.fieldScene.events.off('FIELD_RESTART');
            this.fieldScene.events.off('EVENT');
            this.fieldScene.events.off('EVENT_END');
            this.fieldScene.events.off('BATTLE');
            this.fieldScene.events.off('FREE_MESSAGE_WINDOW');
            this.fieldScene.events.off('FADE_IN_START');
            this.fieldScene.events.off('CAMERA_NORMAL_EFFECT');
            this.fieldScene.events.off('CAMERA_BLUR');
            this.subs.unsubscribe();
        });
    }
}