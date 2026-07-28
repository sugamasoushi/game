import { Scene } from 'phaser';
import { UiPresenter } from '../UI/presenter/UiPresenter';
import { UiModel } from '../UI/model/UiModel';

import { MenuButton } from '../UI/view/MenuButton';
import { LeftButton } from '../UI/view/LeftButton';
import { RightButton } from '../UI/view/RightButton';
import { FreeMessageView } from '../UI/view/FreeMessageView';
import { StatusView } from '../UI/view/Debug/StatusView';
import { EventTestButton } from './../UI/view/Debug/EventTestButton';
import { BattleTestButton } from '../UI/view/Debug/BattleTestButton';
import { MapTestButton } from './../UI/view/Debug/MapTestButton';
import { StatusTestButton } from '../UI/view/Debug/StatusTestButton';
import { CameraTestButton } from '../UI/view/Debug/CameraTestButton';

export class UI extends Scene {

    game: Phaser.Game;

    private uiModel: UiModel;
    private uiPresenter: UiPresenter;

    private menuButton: MenuButton;
    private leftButton: LeftButton;
    private rightButton: RightButton;
    private freeMessageView: FreeMessageView;

    private statusView: StatusView;
    private eventTestButton: EventTestButton;
    private battleTestButton: BattleTestButton;
    private mapTestButton: MapTestButton;
    private statusTestButton: StatusTestButton;
    private cameraTestButton: CameraTestButton;

    private onUiClose = () => {
        //this.menuButton.fadeIn();
    };

    private onUiForceOff = () => {
        this.leftButton.setDisable();
        this.rightButton.setDisable();
    };

    private onUiVisibleFalse = () => {
        this.leftButton.setVisibleFalse();
        this.rightButton.setVisibleFalse();
    };

    constructor() { super('UI'); }

    init() {
        console.log("UI scene")

        this.uiModel = new UiModel(this);
        this.menuButton = new MenuButton(this);
        this.leftButton = new LeftButton(this);
        this.rightButton = new RightButton(this);

        this.statusView = new StatusView(this);
        this.eventTestButton = new EventTestButton(this);
        this.battleTestButton = new BattleTestButton(this);
        this.mapTestButton = new MapTestButton(this);
        this.statusTestButton = new StatusTestButton(this);
        this.cameraTestButton = new CameraTestButton(this);

        this.freeMessageView = new FreeMessageView(this);
        this.freeMessageView.init();

        this.uiPresenter = new UiPresenter(
            this,
            this.uiModel,
            this.menuButton,
            this.leftButton,
            this.rightButton,
            this.freeMessageView,
            this.statusView,
            this.eventTestButton,
            this.battleTestButton,
            this.mapTestButton,
            this.statusTestButton,
            this.cameraTestButton
        );
    }

    async create() {
        this.uiPresenter.execute();

        //イベントを設定（Phaserのトップレベルのイベント）
        //this.uiScene.game.events.on('UI_OPEN', () => { });//MenuButton.tsで直接処理するため不要
        this.game.events.on('UI_CLOSE', this.onUiClose);
        this.game.events.on('UI_FORCE_OFF', this.onUiForceOff);
        this.game.events.on('UI_VISIBLE_FALSE', this.onUiVisibleFalse);

        // UI シーンの停止時に、Game 全体へ登録したイベントも解除する。
        this.events.once('shutdown', () => {
            this.game.events.off('UI_CLOSE', this.onUiClose);
            this.game.events.off('UI_FORCE_OFF', this.onUiForceOff);
            this.game.events.off('UI_VISIBLE_FALSE', this.onUiVisibleFalse);

        });
    }

    public update(time: number, delta: number) {
        if (this.uiPresenter) { this.uiPresenter.update(time, delta); }

    }
}
