import { EventObjState } from "../lib/types";

type TextInfomation = {
    fontFamily: string;
    fontColor: string;
    fontSize: number;
    lineSpaceValue: number;
    textLine: number;
}

type MessageWindowInfomation = {
    backColor: string;
    alphaValue: number;
    lineColor: string;
}

type ImageKeyData = {
    normal: string;
    smile: string;
    unger: string;
}

export class SettingData {
    constructor() { }

    //キャラクターの画像キーを取得
    public getImageKeyDataInfomation(scene: Phaser.Scene) {
        //normal: imageKeyData.normal,
        //smile: alphaValue,
        //unger: lineColor,
        return scene.cache.json.get('ImageKeyData');
    }

    //キャラクターの画像キーを取得
    public getCharacterImageKey(scene: Phaser.Scene, characterName: string) {

        const imageKeyData = scene.cache.json.get('ImageKeyData');

        for (const key in imageKeyData) {
            const k = key as keyof typeof imageKeyData;
            if (k === characterName) {
                // console.log(key, imageKeyData[k])
                return {
                    normal: imageKeyData[k].normal,
                    smile: imageKeyData[k].smile,
                    unger: imageKeyData[k].unger
                } as ImageKeyData;
            };
        }
    }

    //イベントデータ
    public getEventFlgFromSaveDataInfomation(scene: Phaser.Scene, eventName: string): number {
        let eventState: number = EventObjState.true;
        const eventFlgData = scene.cache.json.get('savedata').EventFlag;

        //savedataのfalse,trueを0,1で返す
        for (const key in eventFlgData) {
            const k = key as keyof typeof eventFlgData;
            if (k === eventName) {
                if (eventFlgData[k] === false) {
                    // console.log(key, eventFlgData[k])
                    eventState = EventObjState.false;
                }
            }
        }
        return eventState;
    }

    //指定イベントのフラグを更新
    public updateEventFlg(scene: Phaser.Scene, eventName: string, flg: boolean) {
        const eventFlgData = scene.cache.json.get('savedata').EventFlag;

        for (const key in eventFlgData) {
            const k = key as keyof typeof eventFlgData;
            if (k === eventName) {
                // console.log(key, eventFlgData[k])
                eventFlgData[k] = flg;
            }
        }
    }

    //名前データを取得
    public getSpriteNameData(scene: Phaser.Scene, characterName: string) {
        const fieldNameData = scene.cache.json.get('namedata').FieldNameData;

        for (const key in fieldNameData) {
            const k = key as keyof typeof fieldNameData;
            if (k === characterName) {
                console.log(key, fieldNameData[k])
                return fieldNameData[k];
            }
        }
    }


}