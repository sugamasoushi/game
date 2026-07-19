import { UiModel } from "../model/UiModel";
import { MenuButton } from "../view/MenuButton";
import { LeftButton } from "../view/LeftButton";
import { RightButton } from "../view/RightButton";
import { FreeMessageView } from "../view/FreeMessageView";
import { GameStateManager } from "../../core/GameStateManager";
import { State } from "../../lib/StateTypes";
import { Subscription } from "rxjs";

export class UiPresenter {

    private uiScene: Phaser.Scene;
    private gameScene: Phaser.Scene;

    private uiModel: UiModel;
    private menuButton: MenuButton;
    private leftButton: LeftButton;
    private rightButton: RightButton;
    private freeMessageView: FreeMessageView;
    private subs = new Subscription();

    constructor(
        uiScene: Phaser.Scene,
        uiModel: UiModel,
        menuButton: MenuButton,
        leftButton: LeftButton,
        rightButton: RightButton,
        freeMessageView: FreeMessageView
    ) {
        this.uiScene = uiScene;
        this.uiModel = uiModel;
        this.menuButton = menuButton;
        this.leftButton = leftButton;
        this.rightButton = rightButton;
        this.freeMessageView = freeMessageView;

        this.gameScene = this.uiScene.scene.get('Field') as Phaser.Scene;
    }

    public async execute() {
        const gameStateManager = GameStateManager.getInstance();

        //this.menuButton.execute();
        this.leftButton.execute();
        this.rightButton.execute();

        // 全てフェードイン
        this.uiScene.events.on('UI_FADEIN_START', () => {

            if (!gameStateManager.isVirtualPad) return;

            const state = gameStateManager.currentState;
            if (state === State.TITLE || state === State.LOAD || state === State.EVENT || state === State.FIELD) {
                return;
            }

            //this.menuButton.fadeIn();
            this.leftButton.fadeIn();
            this.rightButton.fadeIn();
        });

        // 全てフェードアウト
        this.uiScene.events.on('UI_FADEOUT_START', () => {
            //this.menuButton.fadeOut();
            this.leftButton.fadeOut();
            this.rightButton.fadeOut();
        });

        // フリーメッセージ
        this.uiScene.events.on('UI_FREE_MESSAGE_WINDOW', (message: string, time: number) => {
            this.freeMessageView.messageOutput(message, time);
        });

        // ゲーム状態の監視
        this.subs.add(gameStateManager.state$.subscribe((stateData) => {

            if (stateData.state == State.NOSTATE) {
                // 通常状態
                // 既にfadeOutしている場合はfadeInを呼び、半透明なら解除する
                //this.menuButton.fadeIn();
                this.leftButton.fadeIn();
                this.rightButton.fadeIn();
            }
        }));

        // シーン終了時の破棄
        this.uiScene.events.once('shutdown', () => {
            this.subs.unsubscribe();
            this.uiScene.events.off('UI_FADEIN_START');
            this.uiScene.events.off('UI_FADEOUT_START');
            this.uiScene.events.off('UI_FREE_MESSAGE_WINDOW');
            this.freeMessageView.destroy();
        });
    }

}
