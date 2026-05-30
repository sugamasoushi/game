import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { FieldScene } from '../lib/SceneTypes';
import { FieldData } from '../lib/FieldTypes';
import { GameKeys } from '../lib/CommonTypes';
import { ReadyEvents } from '../lib/typesGamescene';
import { FieldPresenter } from '../field/presenter/FieldPresenter';
import { PlayerPresenter } from '../field/presenter/PlayerPresenter';
import { NpcPresenter } from '../field/presenter/NpcPresenter';
import { ChestPresenter } from '../field/presenter/ChestPresenter';

import { FieldMapModel } from '../field/model/FieldMapModel';
import { ChestModel } from '../field/model/ChestModel';

import { TileMap } from '../field/view/TileMap';
import { MapObject } from '../field/view/MapObject';
import { MapEffect } from '../field/view/MapEffect';
// import { MenuButton } from '../field/view/MenuButton';
// import { SaveButton } from '../field/view/SaveButton';
// import { FireButton } from '../field/view/FireButton';
import { Player } from '../field/view/character/Player';
import { ChestView } from '../field/view/ChestView';

import { GameStateManager, gameStateManager } from '../GameAllState/GameStateManager';

import { InputManager } from '../core/input/InputManager';
import { CameraManager } from '../field/view/CameraManager';
import { FieldMessageWindow } from '../field/view/FieldMessageWindow';

export class Field extends Scene implements FieldScene {

    private gameStateManager: GameStateManager;

    private fieldMapModel: FieldMapModel;
    private chestModel: ChestModel;

    private tileMap: TileMap;
    private mapObject: MapObject;
    private mapEffect: MapEffect;
    private inputManager: InputManager;
    private cameraManager: CameraManager;

    private fieldPresenter: FieldPresenter;
    private playerPresenter: PlayerPresenter;
    private npcPresenter: NpcPresenter;
    private chestPresenter: ChestPresenter;

    private fieldData: FieldData;
    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;
    private keys!: GameKeys;
    private player: Player;

    private chestView: ChestView;
    // private menuButton: MenuButton;
    // private testButton: SaveButton;
    // private fireButton: FireButton;
    private fieldMessageWindow: FieldMessageWindow;

    constructor() { super('Field'); }

    init() {//initはscene開始時にpreloadやcreateより先に実行される。

        //状態管理クラス
        this.gameStateManager = GameStateManager.getInstance();

        this.fieldMapModel = new FieldMapModel(this);
        this.chestModel = new ChestModel(this);

        this.tileMap = new TileMap(this, this.gameStateManager.currentFieldData);
        this.mapObject = new MapObject(this);
        this.mapEffect = new MapEffect(this);
        this.chestView = new ChestView(this);
        // this.menuButton = new MenuButton(this);
        // this.testButton = new SaveButton(this, this.mapObject);
        // this.fireButton = new FireButton(this, this.mapObject);
        this.inputManager = InputManager.getInstance(this);
        this.cameraManager = new CameraManager(this);
        this.fieldMessageWindow = new FieldMessageWindow(this);

        // Presenterに依存関係を注入 (DI)
        this.fieldPresenter = new FieldPresenter(
            this,
            this.fieldMapModel,
            this.tileMap,
            this.mapObject,
            this.mapEffect,
            // this.menuButton,
            // this.testButton,
            // this.fireButton,
            this.cameraManager,
            this.inputManager,
            this.fieldMessageWindow
        );

        this.playerPresenter = new PlayerPresenter(
            this,
            this.fieldMapModel,
            this.fieldPresenter,
            this.inputManager);

        this.npcPresenter = new NpcPresenter(
            this,
            this.fieldMapModel,
            this.fieldPresenter,
            this.inputManager);

        this.chestPresenter = new ChestPresenter(
            this,
            this.chestModel,
            this.chestView,
            this.mapObject,
            this.fieldPresenter,
            this.inputManager);
    }

    async preload() { }

    async create(data: { sceneKey: string }) {

        // マップ設定
        this.fieldMapModel.setFieldData(this.gameStateManager.currentFieldData)

        //各種設定
        this.mainCamera = this.cameras.main;
        this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定
        this.keys = this.input.keyboard!.addKeys("P,H,A,S,E,R") as GameKeys;


        // フィールド（マップや動的タイルセット）の生成・ロード完了を待つ
        // ※ fieldPresenter.create が内部で非同期処理（Promiseやload.start）を行っている前提です
        try {
            await this.fieldPresenter.create(data.sceneKey);

            // 明示的にロード完了イベントを発火（必要に応じて）
            this.game.events.emit('FIELD_LOADED_COMPLETE');
        } catch (error) {
            console.error("フィールドのロード中にエラーが発生しました:", error);
            return;
        }

        // 全てのアセットロードが保証されたので、キャラクターたちを描画（実体化）する
        this.playerPresenter.execute();
        this.npcPresenter.execute();

        // ゲームオーバーの監視
        const gameOverSub = gameStateManager.onGameOver$.subscribe(() => {
            this.input.enabled = false;
            if (this.mainCamera) {
                this.mainCamera.fadeOut(1000);
            }
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
        this.mainCamera.postFX.clear();

        if (this.mainCamera.postFX) {
            // カラーマトリックスエフェクトをカメラに追加
            const cameraFilter = this.mainCamera.postFX.addColorMatrix();

            // 【調整例A】コントラストを高めて、陰影をクッキリさせる
            cameraFilter.contrast(0.5);      // 1.0が基準。1.4でかなりクッキリします

            // 【調整例B】全体を少し暗くして、ライトの光（懐中電灯など）を引き立たせる
            cameraFilter.brightness(-0.2);   // 0.0が基準。-0.1でほんのりダークに

            // 【調整例C】彩度を少し下げて、ドット絵のギラギラ感を抑えトーンを馴染ませる
            cameraFilter.saturate(0.5);     // 1.0が基準。0.85で少し渋い色合いに

            //cameraFilter.hue(180);
        }

        this.scene.resume(); // これにより上の 'resume' イベントが発火する
    }

    changeScene() {
        this.scene.start('GameOver');
    }

    public getFieldData(): FieldData {
        return this.fieldData;
    }

    public setPlayer(playerSprite: Player) {
        this.player = playerSprite;
    }

    public getPlayer(): Player {
        return this.player;
    }

    public getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys {
        return this.cursorsKeys;
    }

    public getGameKeys(): GameKeys {
        return this.keys;
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }

    public getTilemap(): TileMap {
        return this.tileMap;
    }

    public getMapObject(): MapObject {
        return this.mapObject;
    }

    public getTilemapInPixels(): { widthInPixels: number, heightInPixels: number } {
        // return this.tileMap.getTilemapInPixels();
        return { widthInPixels: 0, heightInPixels: 0 };
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