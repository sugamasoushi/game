import { MenuModel } from "../model/MenuModel";
import { MessageObject } from "../../util/MessageObject";
import { SelectAllow } from "../../util/SelectAllow";
import { MessageWindow } from "../../util/MessageWindow";

export class MenuListWindow extends Phaser.GameObjects.Container {

    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;
    private options: Phaser.GameObjects.Text[] = [];
    private messageWindow: MessageWindow;

    public selectAllow: SelectAllow;
    public onSelect: (index: number) => void;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
    }

    public create(array: string[]) {
        const optionX = 0;
        const optionY = 0;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        this.options = [];

        for (let i = 0; i < array.length; i++) {
            // 選択用ラベル（弾など用。現在は空白１文字）
            const Label = messageObject.createTextObject(this.scene, optionX, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['　'], this.menuModel.fontSize);

            // 項目テキスト
            const option = messageObject.createTextObject(this.scene, optionX + 16, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                array[i]
            ], this.menuModel.fontSize);

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
    }
}
