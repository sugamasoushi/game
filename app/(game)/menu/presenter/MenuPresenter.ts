import { GameScene } from "../../lib/types";
import { MenuModel } from "../model/MenuModel";
import { MenuView } from "../view/MenuView";

export class MenuPresenter {

    private scene: Phaser.Scene;
    private gameScene: GameScene;

    private menuModel: MenuModel;
    private menuView: MenuView;

    constructor(
        scene: Phaser.Scene,
        gameScene: GameScene,
        menuModel: MenuModel,
        menuView: MenuView
    ) {
        this.scene = scene;
        this.gameScene = gameScene;
        this.menuModel = menuModel;
        this.menuView = menuView;
    }

    public init() {
        // 必要に応じて初期化フェーズでの追加処理を記述
        this.scene.cameras.main.fadeIn(100);

        // マウスポインタの初期化
        this.scene.input.setDefaultCursor('default');
    }

    public create() {
        // Viewの構築
        this.menuView.create();

        // Viewからのイベント受信設定
        this.scene.events.on('MenuCloseClick', this.onCloseMenu, this);
    }

    public update() {
        // Viewの更新処理呼び出し
        this.menuView.update();
    }

    private onCloseMenu() {
        // メニューの閉じるアニメーションを実行し、完了時にシーンを再開させる
        this.menuView.executeEndAnimation(() => {
            // アニメーション完了後の処理
            this.scene.scene.stop();
            this.gameScene.resumeScene();
            // イベントリスナーの解除
            this.scene.events.off('MenuCloseClick', this.onCloseMenu, this);
        });
    }
}
