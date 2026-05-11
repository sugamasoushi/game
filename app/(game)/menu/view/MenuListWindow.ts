import { MenuModel } from "../model/MenuModel";
import { MessageObject } from "../../util/MessageObject";
import { SelectAllow } from "../../util/SelectAllow";
import { MessageWindow } from "../../util/MessageWindow";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { DataDefinition } from "../../Data/DataDefinition";

export class MenuListWindow extends Phaser.GameObjects.Container {

    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;
    private options: Phaser.GameObjects.Text[] = [];
    private messageWindow: MessageWindow;

    public selectAllow: SelectAllow;
    public onSelect: (index: number) => void;

    private selectedIndex: number = 0;
    private subs = new Subscription();

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

        this.setupPadKeyboardInput();
    }

    private setupPadKeyboardInput() {
        if (this.options.length > 0) {
            this.selectedIndex = 0;
            this.selectAllow.setVisible(true);
            this.selectAllow.updatePosition(this.options[0]);
        }

        const duration = new DataDefinition().getInputInfomation(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        //このウィンドウを開いてから少し時間を空けないと、前の入力が残っていてすぐに反応してしまうことがあるため、少し遅らせてからイベントを設定する
        this.scene.time.delayedCall(100, () => {

            this.subs.add(inputManager.downButton$.pipe(
                throttleTime(duration)
            ).subscribe(() => {
                if (this.selectedIndex + 1 < this.options.length) {
                    this.selectedIndex += 1;
                    this.selectAllow.updatePosition(this.options[this.selectedIndex]);
                }
            }));

            this.subs.add(inputManager.upButton$.pipe(
                throttleTime(duration)
            ).subscribe(() => {
                if (this.selectedIndex - 1 >= 0) {
                    this.selectedIndex -= 1;
                    this.selectAllow.updatePosition(this.options[this.selectedIndex]);
                }
            }));

            this.subs.add(inputManager.decideButton$.pipe(
                throttleTime(duration)
            ).subscribe(() => {
                if (this.onSelect) {
                    this.onSelect(this.selectedIndex);
                }
            }));
        }, [], this.scene);
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        super.destroy(fromScene);
    }
}
