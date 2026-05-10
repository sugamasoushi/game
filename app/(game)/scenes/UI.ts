import { Scene } from 'phaser';
import { UiPresenter } from '../UI/presenter/UiPresenter';
import { UiModel } from '../UI/model/UiModel';

import { MenuButton } from '../UI/view/MenuButton';
import { LeftButton } from '../UI/view/LeftButton';
import { RightButton } from '../UI/view/RightButton';
import { ExecutionEnvironment } from '../core/ExecutionEnvironment';

export class UI extends Scene {
    private debugFlg: boolean | undefined;

    game: Phaser.Game;

    private uiModel: UiModel;
    private uiPresenter: UiPresenter;

    private menuButton: MenuButton;
    private leftButton: LeftButton;
    private rightButton: RightButton;

    constructor() { super('UI'); }

    init() {
        console.log("UI scene")
        this.debugFlg = this.game.config.physics.arcade?.debug;

        this.uiModel = new UiModel(this);
        this.menuButton = new MenuButton(this);
        this.leftButton = new LeftButton(this);
        this.rightButton = new RightButton(this);

        const execEnv = new ExecutionEnvironment();
        if (execEnv.isElectron()) {
            // Electron環境の場合は仮想パッドを非表示（処理を無効化）
            this.leftButton.execute = async () => {};
            this.leftButton.fadeIn = () => {};
            this.leftButton.fadeOut = () => {};
            this.leftButton.setEnable = () => {};
            this.leftButton.setDisable = () => {};

            this.rightButton.execute = async () => {};
            this.rightButton.fadeIn = () => {};
            this.rightButton.fadeOut = () => {};
            this.rightButton.setEnable = () => {};
            this.rightButton.setDisable = () => {};
        }

        this.uiPresenter = new UiPresenter(
            this,
            this.uiModel,
            this.menuButton,
            this.leftButton,
            this.rightButton
        );
    }

    async create() {
        this.uiPresenter.execute();

        //イベントを設定（Phaserのトップレベルのイベント）
        //this.uiScene.game.events.on('UI_OPEN', () => { });//MenuButton.tsで直接処理するため不要
        this.game.events.on('UI_CLOSE', () => {
            //this.menuButton.fadeIn();
        });

        this.game.events.on('UI_FORCE_OFF', () => {
            this.leftButton.setDisable();
            this.rightButton.setDisable();
        });

        //イベントの解除
        this.game.events.once('shutdown', () => {
            //this.game.events.off('UI_OPEN');
            this.game.events.off('UI_CLOSE');
        });
    }

}
