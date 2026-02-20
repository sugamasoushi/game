import { EventScene, GameScene } from "../lib/types";
import { ListWindow } from "./ListWindow";

export default class YesNoWindow extends ListWindow {
    public result: boolean | undefined;

    constructor(scene: GameScene | EventScene, x: number, y: number, list: string[]) {
        super(scene, x, y, list);
    }

    //マウスクリック時のイベント
    public setEvent() {
        return new Promise<number>(resolve => {
            //「A」キー押下
            this.fromScene.input.keyboard!.once(this.keyCode, () => {//一回限りのイベント
                if (this.nowChoiceNo === 0) {
                    this.result = true;
                    this._deleteObject();
                } else if (this.nowChoiceNo === 1) {
                    this.result = false;
                    this._deleteObject();
                }
            });

            //クリック
            this.textObjectList[0].on('pointerdown', () => {
                this.result = true;
                this._deleteObject();
                resolve(this.getNowChoiceNo());
            }, this.scene)

            this.textObjectList[1].on('pointerdown', () => {
                this.result = false;
                this._deleteObject();
                resolve(this.getNowChoiceNo());
            }, this.scene)
        })
    }

}
