import { GameScene } from '../lib/SceneTypes';
import { MenuModel } from "../menu/model/MenuModel";
import { MenuView } from "../menu/view/MenuView";
import { MenuPresenter } from "../menu/presenter/MenuPresenter";

export class Menu extends Phaser.Scene {

    private gameScene: GameScene;

    // MVP
    private menuModel: MenuModel;
    private menuView: MenuView;
    private menuPresenter: MenuPresenter;

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
    }

    create() {
        this.menuPresenter.create();
    }
}