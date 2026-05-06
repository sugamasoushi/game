import { Scene } from 'phaser';
import { UiPresenter } from '../UI/presenter/UiPresenter';
import { UiModel } from '../UI/model/UiModel';

import { MenuButton } from '../UI/view/MenuButton';
import { LeftButton } from '../UI/view/LeftButton';
import { RightButton } from '../UI/view/RightButton';

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

        //イベントの解除
        this.game.events.once('shutdown', () => {
            //this.game.events.off('UI_OPEN');
            this.game.events.off('UI_CLOSE');
        });
    }

}
