import { EventScene, FieldScene } from "../lib/types";
import { MessageObject } from "./MessageObject";
import { MessageWindow } from "./MessageWindow";
import { GameSettingData } from "../Data/GameSettingData";
import { Menu } from "../scenes/Menu";
import { InputManager } from "../core/input/InputManager";
import { Subscription } from "rxjs";

export class ListWindow extends Phaser.GameObjects.Graphics {
    protected fromScene: FieldScene | EventScene | Menu;
    private messageObject: MessageObject;
    private messageWindowInstance: MessageWindow;
    private cursorObj: Phaser.GameObjects.Graphics;
    private messageWindow: Phaser.GameObjects.Graphics;

    private fontFamily: string;
    private fontColor: number;
    private fontSize: number;
    private lineSpaceValue: number;
    private textLine: number;
    private backColor: number;
    private alphaValue: number;
    private lineColor: number;

    protected textObjectList: Phaser.GameObjects.Text[];

    public messageWidth: number;
    public messageHeight: number;
    protected keyCode: string;
    protected nowChoiceNo: number = 0;
    protected nextChoiceNo: number;
    protected subs = new Subscription();

    private choicetList = ['はい', 'いいえ']//デフォルト

    constructor(scene: FieldScene | EventScene | Menu, x: number, y: number, list: string[]) {
        super(scene);
        this.x = x;
        this.y = y;
        this.fromScene = scene;
        if (list) {
            this.choicetList = list;
        }
        this.addToUpdateList();

    }

    public init() {
        this.nowChoiceNo = 0;
        this.messageWidth = 0;//メッセージの範囲
        this.messageHeight = 0
        this.keyCode = 'keydown-A';

        const eventMessageSettings = GameSettingData.getEventMessageSettings(this.fromScene);
        this.fontFamily = eventMessageSettings.fontFamily;
        const fontColorData = eventMessageSettings.fontColor;
        this.fontColor = Phaser.Display.Color.HexStringToColor(fontColorData).color;
        this.fontSize = Number(eventMessageSettings.fontSize);
        this.lineSpaceValue = Number(eventMessageSettings.lineSpaceValue);
        this.textLine = Number(eventMessageSettings.textLine);
        const messageWindowSettings = GameSettingData.getMessageWindowSettings(this.fromScene);
        this.alphaValue = Number(messageWindowSettings.alphaValue);
        const backColorData = messageWindowSettings.backColor;
        this.backColor = Phaser.Display.Color.HexStringToColor(backColorData).color;
        const lineColorData = messageWindowSettings.lineColor;
        this.lineColor = Phaser.Display.Color.HexStringToColor(lineColorData).color;

        //選択肢の作成
        this.createListText(this.choicetList, this.x, this.y);

        this.selectCheck();
        this.createCursor(this.x, this.y);

        //メッセージウィンドウ
        const rectR = 16;
        this.messageWindowInstance = new MessageWindow(this.fromScene);
        this.messageWindowInstance.init();
        this.messageWindowInstance.createMessageWindow(
            this.x - rectR * 2 - this.fontSize,
            this.y - rectR * 2,
            this.messageWidth + rectR * 2 + this.fontSize,
            this.messageHeight + rectR * 2,
            rectR,
            undefined
        );

        this.setupInput();
    }

    private setupInput() {
        const inputManager = InputManager.getInstance(this.fromScene as Phaser.Scene);
        const minNo = 0;
        const maxNo = this.choicetList.length;

        this.subs.add(inputManager.downButton$.subscribe(() => {
            if (this.nowChoiceNo + 1 >= maxNo) { return; }
            this.nextChoiceNo = this.nowChoiceNo + 1;
            this.cursorUpdate();
        }));

        this.subs.add(inputManager.upButton$.subscribe(() => {
            if (this.nowChoiceNo - 1 < minNo) { return; }
            this.nextChoiceNo = this.nowChoiceNo - 1;
            this.cursorUpdate();
        }));
    }

    preUpdate(time: number, delta: number) {
        void time;
        void delta;
        // InputManagerによる購読モデルに移行したため、ポーリングは不要
        // this.updateNowChoiceNoKeyboard();
    }

    private createCursor(x: number, y: number) {
        this.cursorObj = this.scene.add.graphics();

        const pointX = x - 5;
        const pointY = y + this.fontSize / 2;
        this.cursorObj.fillStyle(Number(this.lineColor), 1).setAlpha(this.alphaValue);
        this.cursorObj.fillTriangle(
            pointX,
            pointY,
            pointX - this.fontSize / 2,
            pointY - this.fontSize / 2,
            pointX - this.fontSize / 2,
            pointY + this.fontSize / 2);
        this.cursorObj.setDepth(500 + 1);

        this.scene.add.tween({
            targets: this.cursorObj,
            x: 3,
            ease: 'sine.inout',
            duration: 500,
            repeat: -1,
            yoyo: true
        })
    }

    //マウス操作
    private selectCheck() {
        //マウスオーバーで選択を更新
        for (let i = 0; i < this.textObjectList.length; i++) {
            this.textObjectList[i].on('pointerover', () => {
                this.nextChoiceNo = i;
                this.cursorUpdate();
            }, this.scene)
        }
    }

    //選択位置まで移動
    private cursorUpdate() {
        //負の場合は上の行へ移動、正の場合は下の行へ移動
        const moveToList = this.nextChoiceNo * (this.fontSize + this.lineSpaceValue);

        //カーソル位置は座標設定
        this.cursorObj.y = moveToList;
        this.nowChoiceNo = this.nextChoiceNo;
    }

    //文字配列を渡すとクリック可能なテキストオブジェクトを作成して返す。
    private createListText(textData: string[], x: number, y: number) {
        let i = 0
        const textObjectArray: Phaser.GameObjects.Text[] = [];

        this.messageObject = new MessageObject();
        this.messageObject.init(this.fromScene);
        const fontSize = this.messageObject.getTextInfomation().fontSize;
        const lineSpaceValue = this.messageObject.getTextInfomation().lineSpaceValue;

        textData.forEach(array => {
            const obj = this.messageObject.createTextObject(this.fromScene, x, y + i * (lineSpaceValue + fontSize), array);
            obj.setDepth(500 + 1);//this.scene.game.config.height + 1

            this.messageHeight = this.messageHeight + fontSize + i * lineSpaceValue;

            if (this.messageWidth < obj.width) {
                this.messageWidth = obj.width;//メッセージの範囲
            }
            textObjectArray.push(obj);
            i++;
        })

        textObjectArray.forEach(array => {
            array.setInteractive({ useHandCursor: true });
        })

        this.textObjectList = textObjectArray;
    }

    _deleteObject() {
        this.textObjectList.forEach(array => {
            array.destroy();
        })
        this.cursorObj.destroy();
        this.messageWindowInstance.destroy();
        this._finish();
    }

    _finish() {
        //使い終わったらインスタンスを破棄
        this.destroy();
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        super.destroy(fromScene);
    }

    public getNowChoiceNo(): number {
        return this.nowChoiceNo;
    }

}
