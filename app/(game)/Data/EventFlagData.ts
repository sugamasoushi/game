import { EventObjState } from "../lib/types";

/** savedata.json の EventFlag セクションを操作する */
export class EventFlagData {
    /** イベントフラグを取得（savedata の false/true を EventObjState の 0/1 で返す） */
    public static getFlag(scene: Phaser.Scene, eventName: string): number {
        let eventState: number = EventObjState.true;
        const eventFlgData = scene.cache.json.get('savedata').EventFlag;

        for (const key in eventFlgData) {
            const k = key as keyof typeof eventFlgData;
            if (k === eventName && eventFlgData[k] === false) {
                eventState = EventObjState.false;
            }
        }
        return eventState;
    }

    /** 指定イベントのフラグを更新 */
    public static updateFlag(scene: Phaser.Scene, eventName: string, flg: boolean): void {
        const eventFlgData = scene.cache.json.get('savedata').EventFlag;

        for (const key in eventFlgData) {
            const k = key as keyof typeof eventFlgData;
            if (k === eventName) {
                eventFlgData[k] = flg;
            }
        }
    }
}
