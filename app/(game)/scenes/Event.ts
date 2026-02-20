import { EventScene, State } from "../lib/types";
import { SerchEvent } from "../event/SearchEvent";
import { GameStateManager } from "../GameAllState/GameStateManager";

export class Event extends Phaser.Scene implements EventScene {

    private cursorsKeys: Phaser.Types.Input.Keyboard.CursorKeys;//キーボード設定
    private mainCamera: Phaser.Cameras.Scene2D.Camera;

    private serchEventInstance: SerchEvent;

    constructor() { super('Event'); }

    init() {
        this.mainCamera = this.cameras.main;
        this.serchEventInstance = new SerchEvent();
    }

    create() {

        //状態管理クラスから現在のイベント用データを取得
        const manager = GameStateManager.getInstance();
        const eventObj = manager.currentEventObj;

        //キーボード設定
        this.cursorsKeys = this.input.keyboard!.createCursorKeys();//キーボード設定

        //イベントクラスを取得、実行
        const eventClass = this.serchEventInstance.searchEventClass(this, eventObj);
        if (eventClass) {
            eventClass.init();
            eventClass.execEvent();
        }
    }

    //シーンを終了
    // public async fadeOutEndScene() {

    //     await new Promise<void>(resolve => {
    //         const cam = this.cameras.main;

    //         cam.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
    //             () => {
    //                 this.scene.stop();

    //                 //状態管理を更新
    //                 // const manager = GameStateManager.getInstance();
    //                 // manager.updateState({
    //                 //     state: State.NOSTATE
    //                 // }, 'NoState');

    //                 console.log('event完了');
    //                 resolve();
    //             }
    //         );

    //         cam.fadeOut(200, 0, 0, 0);
    //     });
    // }

    public getCursorsKeys(): Phaser.Types.Input.Keyboard.CursorKeys {
        return this.cursorsKeys;
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }

    //画面更新を再開。このメソッドは別シーンから参照される。
    // public resumeScene() {
    //     this.mainCamera.postFX.clear();
    //     this.scene.resume();
    // }

}
