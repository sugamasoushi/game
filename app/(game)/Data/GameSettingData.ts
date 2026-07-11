export type TextSettings = {
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    lineSpaceValue: number;
    textLine: number;
};

export type MessageWindowSettings = {
    backColor: string;
    alphaValue: number;
    lineColor: string;
};

/** savedata.json の GameSetting セクションから UI 設定を取得する */
export class GameSettingData {
    private static getGameSetting(scene: Phaser.Scene) {
        return scene.cache.json.get('savedata').GameSetting;
    }

    /** 吹き出し会話用テキスト設定 */
    public static getBubbleTextSettings(scene: Phaser.Scene): TextSettings {
        const setting = this.getGameSetting(scene).BubbleWindow;
        return {
            fontFamily: setting.fontFamily,
            fontColor: setting.fontColor,
            fontSize: setting.fontSize,
            lineSpaceValue: setting.lineSpaceValue,
            textLine: setting.textLine,
        };
    }

    /** イベント会話用テキスト設定 */
    public static getEventMessageSettings(scene: Phaser.Scene): TextSettings {
        const setting = this.getGameSetting(scene).EventWindow;
        return {
            fontFamily: setting.fontFamily,
            fontColor: setting.fontColor,
            fontSize: setting.fontSize,
            lineSpaceValue: setting.lineSpaceValue,
            textLine: setting.textLine,
        };
    }

    /** メッセージウィンドウの見た目設定 */
    public static getMessageWindowSettings(scene: Phaser.Scene): MessageWindowSettings {
        const setting = this.getGameSetting(scene).MessageWindow;
        return {
            backColor: setting.backColor,
            alphaValue: setting.alphaValue,
            lineColor: setting.lineColor,
        };
    }

    /** 入力操作の設定（カーソル点滅間隔など） */
    public static getInputSettings(scene: Phaser.Scene): { duration: number } {
        const duration = this.getGameSetting(scene).input.duration;
        return { duration: Number(duration) };
    }
}
