import { UiModel } from "../model/UiModel";
import { MenuButton } from "../view/MenuButton";
import { LeftButton } from "../view/LeftButton";
import { RightButton } from "../view/RightButton";
import { FreeMessageView } from "../view/FreeMessageView";

import { GameStateManager } from "../../core/GameStateManager";
import { State } from "../../lib/StateTypes";
import { Subscription } from "rxjs";

import { StatusView } from "../view/Debug/StatusView";
import { EventTestButton } from './../view/Debug/EventTestButton';
import { BattleTestButton } from "../view/Debug/BattleTestButton";
import { MapTestButton } from "../view/Debug/MapTestButton";
import { StatusTestButton } from './../view/Debug/StatusTestButton';
import { CameraTestButton } from "../view/Debug/CameraTestButton";

export class UiPresenter {

    private uiScene: Phaser.Scene;
    private gameScene: Phaser.Scene;

    private uiModel: UiModel;
    private menuButton: MenuButton;
    private leftButton: LeftButton;
    private rightButton: RightButton;
    private freeMessageView: FreeMessageView;

    private debugmode = false;
    private statusView: StatusView;
    private eventTestButton: EventTestButton;
    private battleTestButton: BattleTestButton;
    private mapTestButton: MapTestButton;
    private statusTestButton: StatusTestButton;
    private cameraTestButton: CameraTestButton;

    private subs = new Subscription();

    constructor(
        uiScene: Phaser.Scene,
        uiModel: UiModel,
        menuButton: MenuButton,
        leftButton: LeftButton,
        rightButton: RightButton,
        freeMessageView: FreeMessageView,
        statusView: StatusView,
        eventTestButton: EventTestButton,
        battleTestButton: BattleTestButton,
        mapTestButton: MapTestButton,
        statusTestButton: StatusTestButton,
        cameraTestButton: CameraTestButton
    ) {
        this.uiScene = uiScene;
        this.uiModel = uiModel;
        this.menuButton = menuButton;
        this.leftButton = leftButton;
        this.rightButton = rightButton;
        this.freeMessageView = freeMessageView;

        this.statusView = statusView;
        this.eventTestButton = eventTestButton;
        this.battleTestButton = battleTestButton;
        this.mapTestButton = mapTestButton;
        this.statusTestButton = statusTestButton;
        this.cameraTestButton = cameraTestButton;

        this.gameScene = this.uiScene.scene.get('Field') as Phaser.Scene;

        const gameStateManager = GameStateManager.getInstance();
        this.debugmode = gameStateManager.isDebugMode;
    }

    public update(time: number, delta: number) {

        if (this.debugmode) {
            if (this.statusView) { this.statusView.update(time, delta); }
        }
    }

    public async execute() {
        const gameStateManager = GameStateManager.getInstance();

        if (this.debugmode) {
            this.statusView.execute();
            this.eventTestButton.execute();
            this.battleTestButton.execute();
            this.mapTestButton.execute();
            this.statusTestButton.execute();
            this.cameraTestButton.execute();
        }

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

            if (!gameStateManager.isVirtualPad) return;

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

            // UIオブジェクトを破棄
            this.leftButton.destroy();
            this.rightButton.destroy();
            this.freeMessageView.destroy();
        });
    }

}
