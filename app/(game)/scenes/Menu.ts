import { FieldScene } from '../lib/SceneTypes';
import { MenuModel } from "../menu/model/MenuModel";
import { MenuView } from "../menu/view/MenuView";
import { MenuPresenter } from "../menu/presenter/MenuPresenter";
import { gameStateManager } from "../core/GameStateManager";

export class Menu extends Phaser.Scene {

    private fieldScene: FieldScene;

    // MVP
    private menuModel: MenuModel;
    private menuView: MenuView;
    private menuPresenter: MenuPresenter;

    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    constructor() { super('Menu'); }

    init() {
        this.fieldScene = (this.scene.get('Field') as FieldScene);

        // 各クラスのインスタンス化
        this.menuModel = new MenuModel(this, this.fieldScene);
        this.menuView = new MenuView(this, this.fieldScene, this.menuModel);
        this.menuPresenter = new MenuPresenter(this, this.fieldScene, this.menuModel, this.menuView);

        // Presenter経由での初期設定呼び出し
        this.menuPresenter.init();

        //キーボード設定
        this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定
    }

    create() {
        this.menuPresenter.create();

        // ゲームオーバーの監視
        const gameOverSub = gameStateManager.onGameOver$.subscribe(() => {
            gameStateManager.triggerGameOver();
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