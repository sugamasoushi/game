import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";
import { GameStateManager } from '../../core/GameStateManager';
import { State } from '../../lib/types';

export class MenuButton {

    private gameScene: Phaser.Scene;
    private menuText: Phaser.GameObjects.Text;
    private menuWindow: MessageWindow;

    constructor(private uiScene: Phaser.Scene) {
        this.gameScene = this.uiScene.scene.get('Field') as Phaser.Scene;
    }

    public async execute() {
        this.createMenuButton();
    }

    private createMenuButton() {

        const gameConfigWidth: number = Number(this.uiScene.game.canvas.width);
        const gameConfigHeight: number = Number(this.uiScene.game.canvas.height);

        //テキストを作成
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.uiScene);
        this.menuText = messageObjectInstance.createTextObject(this.uiScene, 0, 0, ['MENU'], 32);
        // this.menuText.x = gameConfigWidth - this.menuText.width - 64;
        // this.menuText.y = gameConfigHeight - this.menuText.height - 64;
        const buttonX = gameConfigWidth / 4 * 3 - this.menuText.width / 2;
        const buttonY = gameConfigHeight - this.menuText.height - 64;
        this.menuText.x = buttonX;
        this.menuText.y = buttonY;

        //ウィンドウを作成
        this.menuWindow = new MessageWindow(this.uiScene);
        this.menuWindow.init();
        this.menuWindow.createOneColumnOneWindow(this.menuText);
        this.menuWindow.setDepth(this.menuText.depth - 10);

        this.menuText.setAlpha(0);
        this.menuWindow.setAlpha(0);

        this.menuText.on(Phaser.Input.Events.POINTER_UP, async (
            pointer: Phaser.Input.Pointer,
            localX: number,
            localY: number,
            event: Phaser.Types.Input.EventData
        ) => {

            //状態管理クラス
            const gameStateManager = GameStateManager.getInstance();

            //状態がNOSTATE以外の場合は、メニューを開かない
            if (gameStateManager.currentState !== State.NOSTATE) { return; }

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            this.fadeOut();

            //ぼかし
            //https://newdocs.phaser.io/docs/3.70.0/Phaser.GameObjects.Components.FX#addBlur
            const mainCamera: Phaser.Cameras.Scene2D.Camera = this.gameScene.cameras.main;
            mainCamera.postFX.addBlur(2, 1, 1, 1, 0xffffff, 1);

            //状態更新
            gameStateManager.updateState({ state: State.MENU }, 'menu');
        });
    }

    public setEnable() {
        this.menuText.setAlpha(1);
        this.menuWindow.setAlpha(this.menuWindow.currentAlphaValue);
        this.menuText.setInteractive({ useHandCursor: true });
    }

    public setDisable() {
        this.menuText.setAlpha(0.3);
        this.menuWindow.setAlpha(0.3);
        this.menuText.disableInteractive();
    }

    public fadeIn() {
        const duration = 200;

        this.uiScene.tweens.add({
            targets: this.menuText,
            alpha: 1,
            duration: duration,
            ease: 'Power1',
            onComplete: () => {
                this.menuText.setInteractive({ useHandCursor: true });
            }
        });

        this.uiScene.tweens.add({
            targets: this.menuWindow,
            alpha: this.menuWindow.currentAlphaValue,
            duration: duration,
            ease: 'Power1'
        });
    }

    public fadeOut() {
        const duration = 200;

        this.uiScene.tweens.add({
            targets: this.menuText,
            alpha: 0,
            duration: duration,
            ease: 'Power1',
            onStart: () => {
                this.menuText.disableInteractive();
            }
        });

        this.uiScene.tweens.add({
            targets: this.menuWindow,
            alpha: 0,
            duration: duration,
            ease: 'Power1'
        });
    }
}

