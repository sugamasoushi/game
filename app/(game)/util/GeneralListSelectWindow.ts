import { MessageObject } from "./MessageObject";
import { MessageWindow } from "./MessageWindow";
import { SelectAllow } from "./SelectAllow";
import { GameSettingData } from "../Data/GameSettingData";
import { SearchCharacterData } from "../Data/SearchCharacterData";
import { InputManager } from "../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";

export class GeneralListSelectWindow extends Phaser.GameObjects.Container {
    private options: Phaser.GameObjects.Text[] = [];
    private messageWindow: MessageWindow;
    private selectAllow: SelectAllow;
    private nowSelectNo: number = 0;

    private subs = new Subscription();
    private canDecide: boolean = false;

    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    public onSelect: (index: number) => void;
    public onBack: () => void;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene.add.existing(this);
        this.name = GeneralListSelectWindow.name;
        this.setVisible(false);
        this.setActive(false);
        this.setupInput();
    }

    init() {
        if (this.selectAllow) return;
        this.x = 0;
        this.y = 0;

        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.add(this.selectAllow);
    }

    create(array: string[]) {
        // 既存の要素を削除
        this.options = [];
        if (this.selectAllow) {
            this.remove(this.selectAllow, false);
        }
        this.removeAll(true);
        if (this.selectAllow) {
            this.add(this.selectAllow);
        }

        const optionX = 0;
        const optionY = 0;

        this.init();
        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        for (let i = 0; i < array.length; i++) {
            // カーソル用の空白
            const Label = messageObject.createTextObject(
                this.scene,
                optionX,
                optionY + i * (messageObject.getTextInfomation().lineSpaceValue + messageObject.getTextInfomation().fontSize),
                ['　'],
                messageObject.getTextInfomation().fontSize);

            // 項目テキスト
            const option = messageObject.createTextObject(
                this.scene,
                optionX + 16,
                optionY + i * (messageObject.getTextInfomation().lineSpaceValue + messageObject.getTextInfomation().fontSize),
                [array[i]],
                messageObject.getTextInfomation().fontSize);

            this.add([Label, option]);
            this.options.push(option);

            option.setInteractive({ useHandCursor: true });
            option.on('pointerover', () => {
                this.nowSelectNo = i;
                this.selectAllow.updatePosition(option);
            });
            option.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.submitDecide(i);
                }
            });
        }

        // メッセージウィンドウの作成
        this.messageWindow = new MessageWindow(this.scene);
        this.messageWindow.init();
        this.messageWindow.createVerticalColumnWindow(this.options, 16);
        this.messageWindow.x = 16;
        this.messageWindow.y = 0;
        this.addAt(this.messageWindow, 0);

        // 戻るボタンの作成
        this.createBackButton(this.messageWindow.x + this.messageWindow.width - 48, this.messageWindow.y - 32);

        this.selectAllow.setDepth(this.messageWindow.depth + 1);
        if (this.options.length > 0) {
            this.selectAllow.updatePosition(this.options[0]);
        }
    }

    private createBackButton(x: number, y: number) {
        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        this.backButton = messageObject.createTextObject(this.scene, x, y, "✖");
        this.backButton.setDepth(1001);

        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);
        this.backButtonWindow.setDepth(1000);

        this.add([this.backButtonWindow, this.backButton]);

        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.submitBack();
        });
    }

    private setupInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(1);
        }));
        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(-1);
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            this.submitDecide(this.nowSelectNo);
        }));

        this.subs.add(inputManager.cancelButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            this.submitBack();
        }));
    }

    private navigate(delta: number) {
        if (this.options.length === 0) return;
        let newNo = this.nowSelectNo + delta;
        if (newNo < 0) newNo = 0;
        if (newNo >= this.options.length) newNo = this.options.length - 1;

        if (newNo !== this.nowSelectNo) {
            this.nowSelectNo = newNo;
            this.selectAllow.updatePosition(this.options[this.nowSelectNo]);
        }
    }

    private submitDecide(index: number) {
        if (this.onSelect) {
            this.onSelect(index);
        }
    }

    private submitBack() {
        if (this.onBack) {
            this.onBack();
        }
    }

    show(partyList: Phaser.GameObjects.Sprite[] = []) {
        // もしcreateが呼ばれていない場合は、partyListから作成（ItemSelectWindow等からの呼び出し用）
        if (this.options.length === 0 && partyList.length > 0) {
            const searchCharacterData = new SearchCharacterData(this.scene.cache.json);
            const partyNames = partyList.map(member => searchCharacterData.getDisplayName(member.name));
            this.create(partyNames);
        }

        this.nowSelectNo = 0;
        if (this.options.length > 0) {
            this.selectAllow.updatePosition(this.options[0]);
        }

        this.setVisible(true);
        this.setActive(true);

        if (this.backButton) this.backButton.setVisible(true);
        if (this.backButtonWindow) this.backButtonWindow.setVisible(true);

        this.canDecide = false;
        this.scene.time.delayedCall(10, () => {
            this.canDecide = true;
        });
    }

    hide() {
        this.setVisible(false);
        this.setActive(false);
        if (this.backButton) this.backButton.setVisible(false);
        if (this.backButtonWindow) this.backButtonWindow.setVisible(false);
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        super.destroy(fromScene);
    }
}
