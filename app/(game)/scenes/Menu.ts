import { GameScene } from '../lib/SceneTypes';
import { MenuModel } from "../menu/model/MenuModel";
import { MenuView } from "../menu/view/MenuView";
import { MenuPresenter } from "../menu/presenter/MenuPresenter";
import { gameStateManager } from "../GameAllState/GameStateManager";

export class Menu extends Phaser.Scene {

    private gameScene: GameScene;

    // MVP
    private menuModel: MenuModel;
    private menuView: MenuView;
    private menuPresenter: MenuPresenter;

    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    constructor() { super('Menu'); }

    init() {
        console.log('Menu');
        this.gameScene = (this.scene.get('Game') as GameScene);

        // 各クラスのインスタンス化
        this.menuModel = new MenuModel(this, this.gameScene);
        this.menuView = new MenuView(this, this.gameScene, this.menuModel);
        this.menuPresenter = new MenuPresenter(this, this.gameScene, this.menuModel, this.menuView);

        // Presenter経由での初期設定呼び出し
        this.menuPresenter.init();

        //キーボード設定
        this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定
    }

    create() {
        this.menuPresenter.create();

        // ゲームオーバーの監視
        const gameOverSub = gameStateManager.onGameOver$.subscribe(() => {
            this.input.enabled = false;
        });
        this.events.once('shutdown', () => gameOverSub.unsubscribe());
    }

    public getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys {
        return this.cursorsKeys;
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }
}