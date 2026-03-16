import { GameScene } from "../../lib/types";
import { MenuModel } from "../model/MenuModel";
import DebugMessage from '../../util/DebugMessage';

export class MainColumnWindow {

    private scene: Phaser.Scene;
    private gameScene: GameScene;
    private menuModel: MenuModel;

    public BackButton: Phaser.GameObjects.Text;

    private displayWidth: number;
    private displayHeight: number;

    private mainWindowDepth: number = 500;
    public mainWindow: Phaser.GameObjects.Graphics;

    public containtsX = 0;
    public containtsY = 0;
    public scrollValue: number;

    public cropRectMask: Phaser.GameObjects.Graphics;
    
    public mainColumn: string[] = ['コンディション', 'アイテム', '装備', 'スキル', 'ステータス', 'セーブ', 'オプション'];
    public nowMainColumnNo = 0;
    public nextMainColumnNo = 0;
    
    public mainColumnLabelText: Phaser.GameObjects.Text[] = [];
    public mainColumnLabelWindow: Phaser.GameObjects.Graphics[] = [];

    public allowObj: Phaser.GameObjects.Graphics;
    public allowTween: Phaser.Tweens.Tween;

    private containerArray: Phaser.GameObjects.Container[] = []; //他のViewのコンテナを登録してもらう

    constructor(scene: Phaser.Scene, gameScene: GameScene, menuModel: MenuModel) {
        this.scene = scene;
        this.gameScene = gameScene;
        this.menuModel = menuModel;

        this.displayWidth = Number(this.scene.game.config.width);
        this.displayHeight = Number(this.scene.game.config.height);
    }

    public create() {
        this.createBackButton();
        this.createMainWindow();
        this.createAllow();
    }

    public update() {
        this.updateMainColumnLabelWindow();
        this._updateAllow();
    }

    // 各Windowのコンテナを受け取るためのメソッド
    public setContainers(containers: Phaser.GameObjects.Container[]) {
        this.containerArray = containers;
    }

    private createBackButton() {
        this.BackButton = this.scene.add.text(
            1150, 50,
            "✖", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        this.BackButton.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.BackButton.setDepth(Number(this.scene.game.config.height));
        this.BackButton.setScrollFactor(0);
        this.BackButton.setInteractive({ useHandCursor: true });
        this.BackButton.on('pointerdown', () => {
             // プレゼンター側にイベントを通知
            this.scene.events.emit('MenuCloseClick');
        }, this);
    }

    private createMainWindow() {
        const leftLabelX = 150;
        let labelDisplayWidth = 0;
        const leftLabelY = 100;

        for (let i = 0; i < this.mainColumn.length; i++) {
            const text = this.scene.add.text(leftLabelX, leftLabelY, this.mainColumn[i], {
                fontFamily: this.menuModel.fontFamily,
                fontSize: this.menuModel.fontSize,
                lineSpacing: this.menuModel.lineSpaceValue,
                color: this.menuModel.fontColor
            });
            text.setDepth(this.mainWindowDepth);
            this.mainColumnLabelText.push(text);
        }

        labelDisplayWidth = this.displayWidth - leftLabelX * 2 - this.mainColumnLabelText[0].width - this.mainColumnLabelText[this.mainColumnLabelText.length - 1].width;

        let width = labelDisplayWidth;
        for (let i = 1; i < this.mainColumnLabelText.length - 1; i++) {
            width -= this.mainColumnLabelText[i].width;
        }
        width = width / (this.mainColumnLabelText.length - 1);

        let labelWidth = 0;
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            this.mainColumnLabelText[i].x = leftLabelX + labelWidth;
            labelWidth += this.mainColumnLabelText[i].width + width;
        }

        const rectR = 8;
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            this.mainColumnLabelWindow.push(this.scene.add.graphics());

            const windowWidth = this.mainColumnLabelText[i].width + rectR * 2;
            const windowHeight = this.mainColumnLabelText[i].height + rectR * 2;

            this.mainColumnLabelWindow[i].x = this.mainColumnLabelText[i].x;
            this.mainColumnLabelWindow[i].y = this.mainColumnLabelText[i].y;
            this.mainColumnLabelWindow[i].fillStyle(this.menuModel.backColor, 1).setAlpha(this.menuModel.alphaValue);
            this.mainColumnLabelWindow[i].fillRoundedRect(-1 * rectR, -1 * rectR, windowWidth, windowHeight, rectR);
            this.mainColumnLabelWindow[i].lineStyle(2, this.menuModel.lineColor, 1);
            this.mainColumnLabelWindow[i].strokeRoundedRect(-1 * rectR, -1 * rectR, windowWidth, windowHeight, rectR);
            this.mainColumnLabelWindow[i].setDepth(this.mainWindowDepth - 1);
        }

        this.mainColumnLabelText.forEach(array => {
            array.setInteractive({ useHandCursor: true });
            array.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        });

        const addWidth = 10;
        const mainWindowX = leftLabelX - addWidth;
        const mainWindowY = leftLabelY - addWidth;

        const mainWindowWidth = this.displayWidth - mainWindowX * 2;
        const mainWindowHeight = this.displayHeight - mainWindowY * 2;
        this.scrollValue = mainWindowWidth;

        this.mainWindow = this.scene.add.graphics();
        this.mainWindow.x = mainWindowX;
        this.mainWindow.y = mainWindowY;
        this.mainWindow.fillStyle(this.menuModel.backColor, 1).setAlpha(this.menuModel.alphaValue);
        this.mainWindow.fillRoundedRect(-1 * rectR, -1 * rectR, mainWindowWidth + rectR * 2, mainWindowHeight, rectR);
        this.mainWindow.lineStyle(2, this.menuModel.lineColor, 1);
        this.mainWindow.strokeRoundedRect(-1 * rectR, -1 * rectR, mainWindowWidth + rectR * 2, mainWindowHeight, rectR);
        this.mainWindow.setDepth(this.mainWindowDepth - 2);

        this.cropRectMask = this.scene.add.graphics();
        this.cropRectMask.x = mainWindowX;
        this.cropRectMask.y = mainWindowY + 80;
        this.cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        this.cropRectMask.fillRect(0, 0, mainWindowWidth, mainWindowHeight - 80 - rectR * 2);
        this.cropRectMask.setAlpha(0.5);
        this.cropRectMask.setVisible(false);

        this.containtsX = this.cropRectMask.x;
        this.containtsY = this.cropRectMask.y;

        const duration = 200;
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            this.mainColumnLabelText[i].on('pointerdown', () => {
                // コンテナ配列が空の場合は（まだセットされていなければ）何もしない
                if (this.containerArray.length === 0) return;

                if (i !== this.nowMainColumnNo) {
                    if ((i - this.nowMainColumnNo) > 0) {
                        this.containerArray[i].x = this.containtsX + this.scrollValue;

                        this.scene.tweens.add({
                            targets: this.containerArray[this.nowMainColumnNo],
                            x: this.containerArray[this.nowMainColumnNo].x - this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[this.nowMainColumnNo].x = this.containtsX + this.scrollValue;
                            }
                        });

                        this.scene.tweens.add({
                            targets: this.containerArray[i],
                            x: this.containerArray[i].x - this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[i].x = this.containtsX;
                                this.nextMainColumnNo = i;
                            }
                        });
                    };

                    if ((i - this.nowMainColumnNo) < 0) {
                        this.containerArray[i].x = this.containtsX - this.scrollValue;

                        this.scene.tweens.add({
                            targets: this.containerArray[this.nowMainColumnNo],
                            x: this.containerArray[this.nowMainColumnNo].x + this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[this.nowMainColumnNo].x = this.containtsX + this.scrollValue;
                            }
                        });

                        this.scene.tweens.add({
                            targets: this.containerArray[i],
                            x: this.containerArray[i].x + this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[i].x = this.containtsX;
                                this.nextMainColumnNo = i;
                            }
                        });
                    };
                }
                this.nowMainColumnNo = i;
            }, this.scene);
        }
    }

    private updateMainColumnLabelWindow() {
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            if (this.nowMainColumnNo === i) {
                this.mainColumnLabelText[i].setTint(Phaser.Display.Color.GetColor(255, 255, 255));
            } else {
                this.mainColumnLabelText[i].setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            }
        }
    }

    private createAllow() {
        this.allowObj = this.scene.add.graphics();

        this.allowObj.x = this.containtsX;
        this.allowObj.y = this.containtsY;
        const pointX = 0;
        const pointY = 0 + this.menuModel.fontSize / 2;
        this.allowObj.fillStyle(this.menuModel.lineColor, 1).setAlpha(this.menuModel.alphaValue);
        this.allowObj.fillTriangle(pointX, pointY, pointX - this.menuModel.fontSize / 2, pointY - this.menuModel.fontSize / 2, pointX - this.menuModel.fontSize / 2, pointY + this.menuModel.fontSize / 2);
        this.allowObj.setDepth(this.mainWindowDepth + 1);
        this.allowObj.name = "allow"

        this.allowTween = this.scene.tweens.add({
            targets: this.allowObj,
            x: this.containtsX + 3,
            ease: 'sine.inout',
            duration: 500,
            repeat: -1,
            yoyo: true
        });
        this.allowObj.setVisible(false);
    }

    private _updateAllow() {
        if (this.containerArray.length === 0) return;
        if (this.nextMainColumnNo === this.nowMainColumnNo) return;
        this.allowObj.setVisible(false);

        if (this.nowMainColumnNo === 1) {
            for (let i = 0; i < this.containerArray[this.nowMainColumnNo].list.length; i++) {
                if (i % 2 === 0 && this.containerArray[this.nowMainColumnNo].list[i].type === "Text") {
                    this.containerArray[this.nowMainColumnNo].list[i].setInteractive({ useHandCursor: true });
                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerover', () => {
                        this.allowObj.setVisible(true);

                        this.allowObj.x = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).x + this.containtsX - 5;
                        this.allowObj.y = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).y + this.containtsY;

                        this.allowTween.destroy();
                        this.allowTween = this.scene.tweens.add({
                            targets: this.allowObj,
                            x: this.allowObj.x + 3,
                            ease: 'sine.inout',
                            duration: 500,
                            repeat: -1,
                            yoyo: true
                        });
                    }, this.scene)

                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                        if (pointer.leftButtonDown()) {
                            pointer.reset();
                            const debugMessage = new DebugMessage(this.scene);
                            debugMessage.NotImplemented(undefined);
                            this.gameScene.events.emit('GAME_INPUT_TRUE');
                        }
                    }, this.scene)
                }
            }
        } else if (this.nowMainColumnNo === 2 || this.nowMainColumnNo === 3 || this.nowMainColumnNo === 5 || this.nowMainColumnNo === 6) {
            for (let i = 0; i < this.containerArray[this.nowMainColumnNo].list.length; i++) {
                if (this.containerArray[this.nowMainColumnNo].list[i].type === "Text") {
                    if (i % 2 !== 0) {
                        this.containerArray[this.nowMainColumnNo].list[i].setInteractive({ useHandCursor: true });
                    }
                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerover', () => {
                        this.allowObj.setVisible(true);

                        this.allowObj.x = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).x + this.containtsX - 5;
                        this.allowObj.y = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).y + this.containtsY;

                        this.allowTween.destroy();
                        this.allowTween = this.scene.tweens.add({
                            targets: this.allowObj,
                            x: this.allowObj.x + 3,
                            ease: 'sine.inout',
                            duration: 500,
                            repeat: -1,
                            yoyo: true
                        });
                    }, this.scene)
                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                        if (pointer.leftButtonDown()) {
                            pointer.reset();
                            const debugMessage = new DebugMessage(this.scene);
                            debugMessage.NotImplemented(undefined);
                            this.gameScene.events.emit('GAME_INPUT_TRUE');
                        }
                    }, this.scene)
                }
            }
        }
    }

    public executeEndAnimation(onComplete: () => void) {
        const pixelated = this.scene.cameras.main.postFX.addPixelate(-1);
        this.scene.add.tween({
            targets: pixelated,
            duration: 700,
            amount: 40,
            onComplete: () => {
                this.scene.cameras.main.fadeOut(100);
                this.mainColumnLabelText = [];
                this.mainColumnLabelWindow = [];
                this.containerArray = [];
                this.nowMainColumnNo = 0;
                onComplete();
            }
        });
    }

}
