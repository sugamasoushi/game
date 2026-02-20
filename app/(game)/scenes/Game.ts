import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { GameScene, FieldData, GameKeys } from '../lib/types';
import { ReadyEvents } from '../lib/typesGamescene';
import { FieldPresenter } from '../gamemain/presenter/FieldPresenter';
import { PlayerPresenter } from '../gamemain/presenter/PlayerPresenter';
import { NpcPresenter } from '../gamemain/presenter/NpcPresenter';
import { FieldMapModel } from '../gamemain/model/FieldMapModel';
import { TileMap } from '../gamemain/view/TileMap';
import { MapObject } from '../gamemain/view/MapObject';
import { MenuButton } from '../gamemain/view/MenuButton';
import { Player } from '../gamemain/view/character/Player';

import { GameStateManager } from '../GameAllState/GameStateManager';

import { InputManager } from '../core/input/InputManager';
import { CameraManager } from '../gamemain/view/CameraManager';

export class Game extends Scene implements GameScene {
    private ReadyEventsKey: ReadyEvents = {
        TILEMAP: 'Tilemap:create',
        MAPOBJECT: 'MapObject:create',
        MENUBUTTON: 'MenuButton:create',
        FIELDPRESENTER_READY: 'FieldPresenter:Ready'
    }
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

    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameText: Phaser.GameObjects.Text;

    private menuButton: MenuButton;

    constructor() { super('Game'); }

    init() {//initはscene開始時にpreloadやcreateより先に実行される。
        this.fieldMapModel = new FieldMapModel(this);
        this.tileMap = new TileMap(this);
        this.mapObject = new MapObject(this);
        this.menuButton = new MenuButton(this);
        this.inputManager = new InputManager(this);
        this.cameraManager = new CameraManager(this);

        // Presenterに依存関係を注入 (DI)
        this.fieldPresenter = new FieldPresenter(
            this,
            this.fieldMapModel,
            this.tileMap,
            this.mapObject,
            this.menuButton,
            this.cameraManager,
            this.inputManager
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

    create(data: { sceneKey: string }) {

        //状態管理クラス
        const manager = GameStateManager.getInstance();

        // マップ設定
        this.fieldMapModel.setFieldData(manager.currentFieldData)

        //各種設定
        this.mainCamera = this.cameras.main;
        this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定
        this.keys = this.input.keyboard!.addKeys("P,H,A,S,E,R") as GameKeys;

        this.fieldPresenter.create(data.sceneKey);
        this.playerPresenter.execute();
        this.npcPresenter.execute();

        EventBus.emit('current-scene-ready', this);
    }

    //画面黒塗りオブジェクトを返す
    public setBlackScreenRect(): Phaser.GameObjects.Rectangle {
        return this.add.rectangle(
            0,
            0,
            this.scale.width,
            this.scale.height,
            0x000000,
            1
        ).setOrigin(0).setDepth(99999);

        // 消すとき
        // overlay.destroy();
    }

    //画面更新を再開。このメソッドは別シーンから参照される。
    public resumeScene() {
        this.mainCamera.postFX.clear();
        this.scene.resume();
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