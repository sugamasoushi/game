import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { FieldScene } from '../lib/SceneTypes';
// import { ReadyEvents } from '../lib/typesGamescene';
import { FieldScenePresenter } from '../field/presenter/FieldScenePresenter';
import { FieldSceneModel } from '../field/model/FieldSceneModel';

import { gameStateManager } from '../core/GameStateManager';
import { InputManager } from '../core/input/InputManager';
import { CameraManager } from '../field/view/CameraManager';
import { FieldMessageWindow } from '../field/view/FieldMessageWindow';
import { State } from '../lib/types';

export class Field extends Scene implements FieldScene {

    private fieldSceneModel: FieldSceneModel;
    private fieldScenePresenter: FieldScenePresenter;

    private inputManager: InputManager;
    private cameraManager: CameraManager;
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    private fieldMessageWindow: FieldMessageWindow;

    constructor() { super('Field'); }

    init() {//initはscene開始時にpreloadやcreateより先に実行される。

        this.fieldSceneModel = new FieldSceneModel(this);

        this.inputManager = InputManager.getInstance(this);
        this.cameraManager = new CameraManager(this);
        this.fieldMessageWindow = new FieldMessageWindow(this);

        // Presenterに依存関係を注入 (DI)
        this.fieldScenePresenter = new FieldScenePresenter(
            this,
            this.fieldSceneModel,
            this.cameraManager,
            this.inputManager,
            this.fieldMessageWindow
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
            //gameStateManager.triggerGameOver();
            gameStateManager.updateState({ state: State.GAMEOVER }, 'system');
        });
        this.events.once('shutdown', () => gameOverSub.unsubscribe());

        // シーン再開時の共通処理（Menu, Battle等から戻った時）
        this.events.on('resume', () => {
            // シーン再開時にInputManagerの参照をこのシーンに戻す（ゲームパッド等の入力対象を元に戻すため）
            InputManager.getInstance(this);
        });

        EventBus.emit('current-scene-ready', this);
    }

    //画面更新を再開。このメソッドは別シーンから参照される。
    public resumeScene() {
        // this.mainCamera.postFX.clear();

        // if (this.mainCamera.postFX) {
        //     // カラーマトリックスエフェクトをカメラに追加
        //     const cameraFilter = this.mainCamera.postFX.addColorMatrix();

        //     // 【調整例A】コントラストを高めて、陰影をクッキリさせる
        //     cameraFilter.contrast(0.5);      // 1.0が基準。1.4でかなりクッキリします

        //     // 【調整例B】全体を少し暗くして、ライトの光（懐中電灯など）を引き立たせる
        //     cameraFilter.brightness(-0.2);   // 0.0が基準。-0.1でほんのりダークに

        //     // 【調整例C】彩度を少し下げて、ドット絵のギラギラ感を抑えトーンを馴染ませる
        //     cameraFilter.saturate(0.5);     // 1.0が基準。0.85で少し渋い色合いに

        //     //cameraFilter.hue(180);
        // }

        this.events.emit('CAMERA_NORMAL_EFFECT');

        this.scene.resume(); // これにより上の 'resume' イベントが発火する
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
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