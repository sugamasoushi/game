import { EventScene } from '../lib/SceneTypes';
import { SerchEvent } from "../event/SearchEvent";
import { GameStateManager, gameStateManager } from "../core/GameStateManager";
import { State } from '../lib/types';

export class BubbleTalk extends Phaser.Scene implements EventScene {

    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    private serchEventInstance: SerchEvent;

    constructor() { super('BubbleTalk'); }

    init() {
        this.mainCamera = this.cameras.main;
        this.serchEventInstance = new SerchEvent();
    }

    create() {

        // //状態管理クラスから現在のイベント用データを取得
        // const manager = GameStateManager.getInstance();
        // const eventObj = manager.currentEventObj;

        // //キーボード設定
        // this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定

        // //イベントクラスを取得、実行
        // const eventClass = this.serchEventInstance.searchEventClass(this, eventObj);
        // if (eventClass) {
        //     eventClass.init();
        //     eventClass.execEvent();
        // }

        // // ゲームオーバーの監視
        // const gameOverSub = gameStateManager.onGameOver$.subscribe(() => {
        //     //gameStateManager.triggerGameOver();
        //     gameStateManager.updateState({ state: State.GAMEOVER }, 'system');
        // });
        // this.events.once('shutdown', () => {
        //     gameOverSub.unsubscribe();
        //     if (eventClass) {
        //         eventClass.destroy();
        //     }
        // });
    }
    public getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys {
        return this.cursorsKeys;
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }
}
