import { FieldScene } from '../../lib/SceneTypes';
import { MenuModel } from "../model/MenuModel";
import { MenuView } from "../view/MenuView";
import { CacheDataUpdate } from "../../core/CacheDataUpdate";
import { GameStateManager } from '../../core/GameStateManager';
import { State } from '../../lib/types';
import { Sound } from '../../scenes/Sound';

export class MenuPresenter {

    private scene: Phaser.Scene;
    private fieldScene: FieldScene;
    private soundScene: Sound;

    private menuModel: MenuModel;
    private menuView: MenuView;

    constructor(
        scene: Phaser.Scene,
        fieldScene: FieldScene,
        menuModel: MenuModel,
        menuView: MenuView
    ) {
        this.scene = scene;
        this.fieldScene = fieldScene;
        this.menuModel = menuModel;
        this.menuView = menuView;
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public init() {
        // 必要に応じて初期化フェーズでの追加処理を記述
        this.scene.cameras.main.fadeIn(100);

        // マウスポインタの初期化
        this.scene.input.setDefaultCursor('default');

        this.soundScene.playSe('SE_cardOpen');
    }

    public create() {
        // Viewの構築
        this.menuView.create();

        // Viewからのイベント受信設定
        this.scene.events.on('GAME_INPUT_TRUE', () => { this.scene.input.enabled = true; });
        this.scene.events.on('GAME_INPUT_FALSE', () => {
            this.scene.input.enabled = false;
            this.scene.input.setDefaultCursor('default');
        });
        this.scene.events.on('MenuCloseClick', this.onCloseMenu, this);
        this.scene.events.on('USE_ITEM', this.onUseItem, this);
        this.scene.events.on('TITLE_BACK', this.onTitleBack, this);
    }

    //アイテム使用
    private onUseItem(itemName: string, count: number, memberIndex: number = 0) {
        this.menuModel.useItem(itemName, count, memberIndex);

        //コンディション画面のステータスを更新
        this.scene.events.emit('UPDATE_CONDITION', this.menuModel.getPlayerData());
    }

    private onCloseMenu() {
        this.soundScene.playSe('SE_bookClose');

        //Phaserのトップレベルのイベント
        this.scene.game.events.emit('UI_CLOSE');

        // メニューの閉じるアニメーションを実行し、完了時にシーンを再開させる
        this.menuView.executeEndAnimation(() => {

            // アニメーション完了後の処理
            this.scene.scene.stop();

            //キャッシュを更新
            const cacheDataUpdate = new CacheDataUpdate(this.fieldScene);
            cacheDataUpdate.phaserCacheDataUpdate();

            this.fieldScene.resumeScene();

            //状態管理クラス
            const gameStateManager = GameStateManager.getInstance();

            //状態更新
            gameStateManager.updateState({ state: State.NOSTATE }, 'MenuClose');


            // イベントリスナーの解除
            this.scene.events.off('GAME_INPUT_TRUE');
            this.scene.events.off('GAME_INPUT_FALSE');
            this.scene.events.off('MenuCloseClick');
            this.scene.events.off('USE_ITEM');
            this.scene.events.off('UPDATE_CONDITION');
        });
    }

    private onTitleBack() {
        console.log('タイトルバック')

        //Phaserのトップレベルのイベント
        this.scene.game.events.emit('UI_CLOSE');

        const mainCamera = this.scene.cameras.main;
        mainCamera.once('camerafadeoutcomplete', () => {

            // アニメーション完了後の処理
            this.scene.scene.stop();

            //状態更新
            const gameStateManager = GameStateManager.getInstance();
            gameStateManager.updateState({ state: State.GAME_RESTART }, 'system');

            // イベントリスナーの解除
            this.scene.events.off('GAME_INPUT_TRUE');
            this.scene.events.off('GAME_INPUT_FALSE');
            this.scene.events.off('MenuCloseClick');
            this.scene.events.off('USE_ITEM');
            this.scene.events.off('UPDATE_CONDITION');

        });

        mainCamera.fadeOut(200);
    }
}
