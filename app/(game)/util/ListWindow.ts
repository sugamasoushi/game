import { EventScene, GameScene } from "../lib/types";
import { MessageObject } from "./MessageObject";
import { MessageWindow } from "./MessageWindow";
import { DataDefinition } from "../Data/DataDefinition";

export class ListWindow extends Phaser.GameObjects.Graphics {
    protected fromScene: GameScene | EventScene;
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

    private messageWidth: number;
    private messageHeight: number;
    protected keyCode: string;
    protected nowChoiceNo: number = 0;
    protected nextChoiceNo: number;

    private selectList: string[];
    choicetList = ['はい', 'いいえ']//デフォルト

    constructor(scene: GameScene | EventScene, x: number, y: number, list: string[]) {
        super(scene);
        this.x = x;
        this.y = y;
        this.fromScene = scene;
        this.selectList = list;
        this.addToUpdateList();

    }

    public init() {
        this.nowChoiceNo = 0;
        this.messageWidth = 0;//メッセージの範囲
        this.messageHeight = 0
        this.keyCode = 'keydown-A';

        const settingData = new DataDefinition();
        this.fontFamily = settingData.getTextInfomation(this.fromScene).fontFamily;
        const fontColorData = settingData.getTextInfomation(this.fromScene).fontColor;
        this.fontColor = Phaser.Display.Color.HexStringToColor(fontColorData).color;
        this.fontSize = Number(settingData.getTextInfomation(this.fromScene).fontSize);
        this.lineSpaceValue = Number(settingData.getTextInfomation(this.fromScene).lineSpaceValue);
        this.textLine = Number(settingData.getTextInfomation(this.fromScene).textLine);
        this.alphaValue = Number(settingData.getMessageWindowInfomation(this.fromScene).alphaValue);
        const backColorData = settingData.getMessageWindowInfomation(this.fromScene).backColor;
        this.backColor = Phaser.Display.Color.HexStringToColor(backColorData).color;
        const lineColorData = settingData.getMessageWindowInfomation(this.fromScene).lineColor;
        this.lineColor = Phaser.Display.Color.HexStringToColor(lineColorData).color;

        //選択肢の作成
        this.createListText(this.choicetList, this.x, this.y);

        this.selectCheck();
        this.createCursor(this.x, this.y);

        //メッセージウィンドウ
        const rectR = 8;
        this.messageWindowInstance = new MessageWindow(this.fromScene);
        this.messageWindowInstance.init();
        this.messageWindowInstance.createMessageWindow(
            this.x - rectR * 2 - this.fontSize,
            this.y - rectR * 2,
            this.messageWidth + rectR * 2 + this.fontSize,
            this.messageHeight + rectR * 2,
            rectR,
            undefined);

    }

    preUpdate(time: number, delta: number) {
        this.updateNowChoiceNoKeyboard();
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

    //キー入力状態のチェック
    private updateNowChoiceNoKeyboard() {
        const minNo = 0;
        const maxNo = this.choicetList.length;

        //キー押下でリストの選択番号を更新する
        if (this.fromScene.getCursorsKeys().down.isDown) {
            //更新後の選択番号がリスト番号の最大値を超える場合
            if (this.nowChoiceNo + 1 >= maxNo) { return; }
            this.nextChoiceNo = this.nowChoiceNo + 1;
            this.cursorUpdate();
        } else if (this.fromScene.getCursorsKeys().up.isDown) {
            //更新後の選択番号がリスト番号の最小値超える場合
            if (this.nowChoiceNo - 1 < minNo) { return; }
            this.nextChoiceNo = this.nowChoiceNo - 1;
            this.cursorUpdate();
        }
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

    public getNowChoiceNo(): number {
        return this.nowChoiceNo;
    }

}
