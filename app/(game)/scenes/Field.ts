import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { FieldScene } from '../lib/SceneTypes';
// import { ReadyEvents } from '../lib/typesGamescene';
import { FieldScenePresenter } from '../field/presenter/FieldScenePresenter';
import { FieldSceneModel } from '../field/model/FieldSceneModel';

import { gameStateManager } from '../core/GameStateManager';
import { InputManager } from '../core/input/InputManager';
import { CameraManager } from '../field/view/CameraManager';
import { State } from '../lib/types';

export class Field extends Scene implements FieldScene {

    private fieldSceneModel: FieldSceneModel;
    private fieldScenePresenter: FieldScenePresenter;

    private inputManager: InputManager;
    private cameraManager: CameraManager;
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    constructor() { super('Field'); }

    init() {//initはscene開始時にpreloadやcreateより先に実行される。

        this.fieldSceneModel = new FieldSceneModel(this);

        this.inputManager = InputManager.getInstance(this);
        this.cameraManager = new CameraManager(this);

        // Presenterに依存関係を注入 (DI)
        this.fieldScenePresenter = new FieldScenePresenter(
            this,
            this.fieldSceneModel,
            this.cameraManager,
            this.inputManager
        );
    }

    async preload() { }

    update(time: number, delta: number) {
        this.fieldScenePresenter.update(time, delta);
    }

    async create(data: { sceneKey: string }) {

        //各種設定
        this.mainCamera = this.cameras.main;

        // フィールド（マップや動的タイルセット）の生成・ロード完了を待つ
        // ※ fieldPresenter.create が内部で非同期処理（Promiseやload.start）を行っている前提です
        try {
            await this.fieldScenePresenter.execute(data.sceneKey);

            // 明示的にロード完了イベントを発火（必要に応じて）
            this.game.events.emit('FIELD_LOADED_COMPLETE');
        } catch (error) {
            console.error("フィールドのロード中にエラーが発生しました:", error);
            return;
        }

        // ゲームオーバーの監視
        const gameOverSub = gameStateManager.onGameOver$.subscribe(() => {
            gameStateManager.updateState({ state: State.GAMEOVER }, 'system');
        });
        this.events.once('shutdown', () => gameOverSub.unsubscribe());

        // シーン再開時の共通処理（Menu, Battle等から戻った時）
        this.events.on('resume', () => {
            // シーン再開時にInputManagerの参照をこのシーンに戻す（ゲームパッド等の入力対象を元に戻すため）
            //InputManager.getInstance(this);

            this.events.emit('CAMERA_NORMAL_EFFECT');
        });

        EventBus.emit('current-scene-ready', this);
    }

    //未使用。画面更新を再開。このメソッドは別シーンから参照される。
    public resumeScene() {
        this.events.emit('CAMERA_NORMAL_EFFECT');

        this.scene.resume(); // これにより上の 'resume' イベントが発火する
    }

    //未使用。
    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }

    public getMakeTilemap(): Phaser.Tilemaps.Tilemap {
        const makeTilemapData = this.fieldSceneModel.getMakeTilemap()
        return makeTilemapData;
    }
}


/**
 * Phaserのライフサイクルと事前処理について
 * Scene作成時、コンストラクタの後にライフサイクルによる事前処理が存在する。
 * ・constructor()→init()→preload()→create()
 * constructor()の時点ではPhaser基盤作成中のような状態でゲームオブジェクトも存在しない場合がある。
 * そのため、純粋なデータ等はinit()で保存処理、ゲームのオブジェクト作成等はcreate()で処理する事。
 * constructor()では基本的に処理しない。
 */