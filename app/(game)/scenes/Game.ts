import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { GameScene } from '../lib/SceneTypes';
import { FieldData } from '../lib/FieldTypes';
import { GameKeys } from '../lib/CommonTypes';
import { ReadyEvents } from '../lib/typesGamescene';
import { FieldPresenter } from '../gamemain/presenter/FieldPresenter';
import { PlayerPresenter } from '../gamemain/presenter/PlayerPresenter';
import { NpcPresenter } from '../gamemain/presenter/NpcPresenter';
import { FieldMapModel } from '../gamemain/model/FieldMapModel';
import { TileMap } from '../gamemain/view/TileMap';
import { MapObject } from '../gamemain/view/MapObject';
import { MenuButton } from '../gamemain/view/MenuButton';
import { SaveButton } from '../gamemain/view/SaveButton';
import { FireButton } from '../gamemain/view/FireButton';
import { Player } from '../gamemain/view/character/Player';

import { GameStateManager, gameStateManager } from '../GameAllState/GameStateManager';

import { InputManager } from '../core/input/InputManager';
import { CameraManager } from '../gamemain/view/CameraManager';
import { FieldMessageWindow } from '../gamemain/view/FieldMessageWindow';

export class Game extends Scene implements GameScene {

    private gameStateManager: GameStateManager;

    private fieldMapModel: FieldMapModel;

    private tileMap: TileMap;
    private mapObject: MapObject;
    private inputManager: InputManager;
    private cameraManager: CameraManager;

    private fieldPresenter: FieldPresenter;
    private playerPresenter: PlayerPresenter;
    private npcPresenter: NpcPresenter;

    private fieldData: FieldData;
    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;
    private keys!: GameKeys;
    private player: Player;

    private menuButton: MenuButton;
    private testButton: SaveButton;
    private fireButton: FireButton;
    private fieldMessageWindow: FieldMessageWindow;

    constructor() { super('Game'); }

    init() {//initはscene開始時にpreloadやcreateより先に実行される。

        //状態管理クラス
        this.gameStateManager = GameStateManager.getInstance();

        this.fieldMapModel = new FieldMapModel(this);
        this.tileMap = new TileMap(this, this.gameStateManager.currentFieldData);
        this.mapObject = new MapObject(this);
        this.menuButton = new MenuButton(this);
        this.testButton = new SaveButton(this, this.mapObject);
        this.fireButton = new FireButton(this, this.mapObject);
        this.inputManager = InputManager.getInstance(this);
        this.cameraManager = new CameraManager(this);
        this.fieldMessageWindow = new FieldMessageWindow(this);

        // Presenterに依存関係を注入 (DI)
        this.fieldPresenter = new FieldPresenter(
            this,
            this.fieldMapModel,
            this.tileMap,
            this.mapObject,
            this.menuButton,
            this.testButton,
            this.fireButton,
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
    }

    preload() {

        //マップチップの読み込み
        this.tileMap.loadTileSetFile(this.gameStateManager.currentFieldData);
    }

    create(data: { sceneKey: string }) {

        // マップ設定
        this.fieldMapModel.setFieldData(this.gameStateManager.currentFieldData)

        //各種設定
        this.mainCamera = this.cameras.main;
        this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定
        this.keys = this.input.keyboard!.addKeys("P,H,A,S,E,R") as GameKeys;

        this.fieldPresenter.create(data.sceneKey);
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