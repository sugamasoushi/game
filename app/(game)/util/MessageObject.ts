/**
 * 会話等に使用する事
 */

type TextInfomation = {
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    lineSpaceValue: number;
    textLine: number;
}

export class MessageObject {
    private fontFamily: string;
    private fontColor: string;
    private fontSize: number;
    private lineSpaceValue: number;
    private textLine: number;

    constructor() { }

    public init(scene: Phaser.Scene) {

        if (scene.scene.key === 'Event' || scene.scene.key === 'Battle' || scene.scene.key === 'Menu') {
            const settingTextData = scene.cache.json.get('savedata').GameSetting.EventWindow;
            this.fontFamily = settingTextData.fontFamily;
            this.fontColor = settingTextData.fontColor;
            this.fontSize = settingTextData.fontSize;
            this.lineSpaceValue = settingTextData.lineSpaceValue;
            this.textLine = settingTextData.textLine;

        } else {

            //吹き出し会話の場合
            const settingTextData = scene.cache.json.get('savedata').GameSetting.BubbleWindow;
            this.fontFamily = settingTextData.fontFamily;
            this.fontColor = settingTextData.fontColor;
            this.fontSize = settingTextData.fontSize;
            this.lineSpaceValue = settingTextData.lineSpaceValue;
            this.textLine = settingTextData.textLine;
        }
    }

    public createTextObject(scene: Phaser.Scene, x: number, y: number, text: string[] | string): Phaser.GameObjects.Text {
        const textObject: Phaser.GameObjects.Text = scene.add.text(x, y, text);
        textObject.setFontFamily(this.fontFamily);
        textObject.setColor(this.fontColor);
        textObject.setFontSize(this.fontSize);
        textObject.setLineSpacing(this.lineSpaceValue);
        textObject.setData('textLine', this.textLine);

        return textObject;
    }

    public getTextInfomation(): TextInfomation {
        return {
            fontFamily: this.fontFamily,
            fontColor: this.fontColor,
            fontSize: this.fontSize,
            lineSpaceValue: this.lineSpaceValue,
            textLine: this.textLine
        }

    }
}