/**
 * 選択リストウィンドウ
 * ウィンドウの履歴に寄らない
 */

import { MessageObject } from "../../util/MessageObject";
import { SelectAllow } from "../../util/SelectAllow";
import { MessageWindow } from "../../util/MessageWindow";
import { DataDefinition } from "../../Data/DataDefinition";

export class SelectListWindow extends Phaser.GameObjects.Container {

    private mainWindowDepth: number = 500;
    private options: Phaser.GameObjects.Text[] = [];
    private messageWindow: MessageWindow;
    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    public selectAllow: SelectAllow;
    public onSelect: (index: number) => void;
    public onBack: () => void;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene.add.existing(this);
    }

    public create(array: string[]) {
        const optionX = 0;
        const optionY = 0;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const dataDefinition = new DataDefinition();
        const eventMessageInfomation = dataDefinition.getEventMessageInfomation(this.scene);

        this.options = [];

        for (let i = 0; i < array.length; i++) {
            // 選択用ラベル（弾など用。現在は空白１文字）
            const Label = messageObject.createTextObject(this.scene, optionX, optionY + i * (eventMessageInfomation.lineSpaceValue + eventMessageInfomation.fontSize), ['　'], eventMessageInfomation.fontSize);

            // 項目テキスト
            const option = messageObject.createTextObject(this.scene, optionX + 16, optionY + i * (eventMessageInfomation.lineSpaceValue + eventMessageInfomation.fontSize), [
                array[i]
            ], eventMessageInfomation.fontSize);

            this.add([Label, option]);
            this.options.push(option);

            option.setInteractive({ useHandCursor: true });
            option.on('pointerover', () => {
                this.selectAllow.updatePosition(option);
            });
            option.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    if (this.onSelect) {
                        this.onSelect(i);
                    }
                }
            });
        }

        // メッセージウィンドウの作成
        this.messageWindow = new MessageWindow(this.scene);
        this.messageWindow.init();
        // 複数テキストに合わせてウィンドウを作成
        this.messageWindow.createVerticalColumnWindow(this.options, 16);
        // 位置を合わせる（テキストの開始位置に合わせる）
        this.messageWindow.x = 16;
        this.messageWindow.y = 0;
        this.addAt(this.messageWindow, 0);

        // 選択アローの作成
        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.selectAllow.setVisible(false);
        this.add(this.selectAllow);

        // 深さの一括設定
        this.setDepth(this.mainWindowDepth + 100);
        const baseDepth = this.depth;
        this.messageWindow.setDepth(baseDepth);
        for (const option of this.options) {
            option.setDepth(baseDepth + 1);
        }
        this.selectAllow.setDepth(baseDepth + 2);

        this.backButtonCreate(this.messageWindow.x + 116, this.messageWindow.y - 40, baseDepth);
    }

    private backButtonCreate(x: number, y: number, baseDepth: number) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        messageObjectInstance.getTextInfomation();

        this.backButton = messageObjectInstance.createTextObject(this.scene, x, y + 16, "✖");
        this.backButton.setDepth(Number(this.scene.game.config.height) + 1);

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        // createMessageWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        // 左右の余白を等しく設定
        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y + 16;
        this.backButtonWindow.setDepth(Number(this.scene.game.config.height));

        this.backButton.setDepth(this.backButtonWindow.depth + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            if (this.onBack) {
                this.onBack();
            }

            this.destroy();

        }, this);

        this.backButtonWindow.setDepth(baseDepth + 1);
        this.backButton.setDepth(baseDepth + 10);

        this.add(this.backButtonWindow);
        this.add(this.backButton);
    }

    public destroy() {
        for (const list of this.options) {
            list.destroy();
        }
        this.options = [];

        this.messageWindow.destroy();
        this.selectAllow.destroy();
        this.backButtonWindow.destroy();
        this.backButton.destroy();
    }
}
