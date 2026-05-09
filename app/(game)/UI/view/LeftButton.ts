import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";
import { DataDefinition } from "../../Data/DataDefinition";

export class LeftButton {

    private uiScene: Phaser.Scene;
    private gameScene: Phaser.Scene;
    private buttons: Phaser.GameObjects.Text[] = [];
    private menuWindow: MessageWindow;
    private hitZone: Phaser.GameObjects.Zone;

    constructor(uiScene: Phaser.Scene) {
        this.uiScene = uiScene;
        this.gameScene = uiScene.scene.get('Game') as Phaser.Scene;
    }

    public async execute() {
        this.createMenuButton();
    }

    private createMenuButton() {
        const gameConfigWidth: number = Number(this.uiScene.game.canvas.width);
        const gameConfigHeight: number = Number(this.uiScene.game.canvas.height);

        const buttonSize = 48; // ボタン1つ分のサイズ
        const centerX = buttonSize * 1.5 + 32; // 左端から余白
        const centerY = gameConfigHeight - buttonSize * 1.5 - 32;

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.uiScene);

        // ウィンドウを作成
        this.menuWindow = new MessageWindow(this.uiScene);
        this.menuWindow.init();
        this.menuWindow.createCrossWindow(centerX, centerY, buttonSize);
        this.menuWindow.setDepth(400);

        const radius = buttonSize * 1.6;
        this.hitZone = this.uiScene.add.zone(centerX, centerY, radius * 2, radius * 2);
        this.hitZone.setDepth(405);
        this.hitZone.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);
        this.hitZone.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
        });
        this.hitZone.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
        });
        this.hitZone.disableInteractive();

        const padInfo = [
            { char: '▲', x: centerX, y: centerY - buttonSize, dir: 'up' },
            { char: '▼', x: centerX, y: centerY + buttonSize, dir: 'down' },
            { char: '◀', x: centerX - buttonSize, y: centerY, dir: 'left' },
            { char: '▶', x: centerX + buttonSize, y: centerY, dir: 'right' },
        ];

        for (const info of padInfo) {
            const text = messageObjectInstance.createTextObject(this.uiScene, 0, 0, [info.char], 32);
            text.setOrigin(0.5);
            text.x = info.x;
            text.y = info.y;
            text.setDepth(410);
            text.setAlpha(0);

            text.on(Phaser.Input.Events.POINTER_DOWN, () => {
                this.uiScene.game.events.emit('VIRTUALPAD_ARROW_KEY_DOWN', info.dir);
            });

            text.on(Phaser.Input.Events.POINTER_UP, async (
                pointer: Phaser.Input.Pointer,
                localX: number,
                localY: number,
                event: Phaser.Types.Input.EventData) => {

                this.uiScene.game.events.emit('VIRTUALPAD_ARROW_KEY_UP');
                //下層のオブジェクトのイベントを止める
                event.stopPropagation();
            });

            text.on(Phaser.Input.Events.POINTER_OUT, () => {
                this.uiScene.game.events.emit('VIRTUALPAD_ARROW_KEY_UP');
            });


            this.buttons.push(text);
        }

        this.menuWindow.setAlpha(0);
    }

    public fadeIn() {
         const duration = 200;

        const radius = 48 * 1.6;
        this.hitZone.setInteractive(new Phaser.Geom.Circle(radius, radius, radius), Phaser.Geom.Circle.Contains);

        for (const button of this.buttons) {
            this.uiScene.tweens.add({
                targets: button,
                alpha: 1,
                duration: duration,
                ease: 'Power1',
                onComplete: () => {
                    button.setInteractive({ useHandCursor: true });

                }
            });
        }

        this.uiScene.tweens.add({
            targets: this.menuWindow,
            alpha: this.menuWindow.currentAlphaValue,
            duration: duration,
            ease: 'Power1'
        });
    }

    public fadeOut() {
        const duration = 200;

        this.hitZone.disableInteractive();

        for (const button of this.buttons) {
            this.uiScene.tweens.add({
                targets: button,
                alpha: 0,
                duration: duration,
                ease: 'Power1',
                onStart: () => {
                    button.disableInteractive();
                }
            });
        }

        this.uiScene.tweens.add({
            targets: this.menuWindow,
            alpha: 0,
            duration: duration,
            ease: 'Power1'
        });
    }
    public setEnable() {
        this.hitZone.setInteractive();
        for (const button of this.buttons) {
            button.setAlpha(1);
            button.setInteractive({ useHandCursor: true });
        }
        this.menuWindow.setAlpha(this.menuWindow.currentAlphaValue);
    }

    public setDisable() {
        this.hitZone.disableInteractive();
        for (const button of this.buttons) {
            button.setAlpha(0.3);
            button.disableInteractive();
        }
        this.menuWindow.setAlpha(0.3);
    }
}

