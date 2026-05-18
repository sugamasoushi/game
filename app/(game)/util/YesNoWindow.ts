import { EventScene, GameScene } from "../lib/types";
import { ListWindow } from "./ListWindow";
import { InputManager } from "../core/input/InputManager";
import { take } from "rxjs";
import { Sound } from "../scenes/Sound";

export default class YesNoWindow extends ListWindow {
    public result: boolean | undefined;
    private soundScene: Sound;

    constructor(scene: GameScene | EventScene, x: number, y: number, list: string[]) {
        super(scene, x, y, list);
        this.soundScene = this.fromScene.scene.get('Sound') as Sound;
    }

    //マウスクリック時のイベント
    public setEvent() {
        const inputManager = InputManager.getInstance(this.fromScene as Phaser.Scene);

        return new Promise<number>(resolve => {
            //決定ボタン（スペース、仮想パッド〇、ゲームパッド〇）
            this.subs.add(inputManager.decideButton$.pipe(take(1)).subscribe(() => {
                if (this.nowChoiceNo === 0) {
                    this.result = true;
                    this.soundScene.SE_decideButton.play();
                    this._deleteObject();
                    resolve(this.getNowChoiceNo());
                } else if (this.nowChoiceNo === 1) {
                    this.result = false;
                    this.soundScene.SE_decideButton.play();
                    this._deleteObject();
                    resolve(this.getNowChoiceNo());
                }
            }));

            //クリック
            this.textObjectList[0].once('pointerdown', () => {
                this.result = true;
                this.soundScene.SE_decideButton.play();
                this._deleteObject();
                resolve(this.getNowChoiceNo());
            }, this.scene)

            this.textObjectList[1].once('pointerdown', () => {
                this.result = false;
                this.soundScene.SE_decideButton.play();
                this._deleteObject();
                resolve(this.getNowChoiceNo());
            }, this.scene)
        })
    }

}
