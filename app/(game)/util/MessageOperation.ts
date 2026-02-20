import { GameScene, EventScene } from '../lib/types';
import { Sound } from '../scenes/Sound';

export class MessageOperation {
    private eventScene: GameScene | EventScene;
    private usePatern: string;
    private messageWidth: number;//メッセージの範囲
    private textLine: number;
    private lineSpaceValue: number;
    private soundScene: Sound;

    //削除アニメーションを適用するオブジェクトを格納
    public messageObjectList: Phaser.GameObjects.GameObject[] = [];
    private deleteMessageFlg: boolean = true;

    private typeWriterObject: Phaser.Time.TimerEvent;
    private scrollTweenObject: Phaser.Tweens.Tween | null;

    private textObject: Phaser.GameObjects.Text;

    constructor(eventScene: EventScene, usePatern: string, textLine: number, lineSpaceValue: number) {
        this.eventScene = eventScene;
        this.usePatern = usePatern;
        this.textLine = textLine;
        this.lineSpaceValue = lineSpaceValue;

        if (this.usePatern === 'Event') {
            this.messageWidth = 1000;//メッセージの範囲

        } else if (this.usePatern === 'BubbleTalk') {
            this.messageWidth = 100;//メッセージの範囲
        }
        this.soundScene = this.eventScene.scene.get('Sound') as Sound;
    }

    public addMessageObjectList(obj: Phaser.GameObjects.GameObject) {
        this.messageObjectList.push(obj);
    }

    //メッセージオブジェクトリストの配列を初期化
    public deleteMessageObject() {
        this.messageObjectList.splice(0);//インスタンス切れてGCになると思うが、処理中の実施はやめた方がよさそう
    }

    //文字描画
    public async typeWriter(scene: Phaser.Scene, textObject: Phaser.GameObjects.Text, text: string) {
        return new Promise<void>(resolve => {
            let i = 0;
            this.typeWriterObject = scene.time.addEvent({
                callback: () => {
                    textObject.text += text[i];
                    this.soundScene.SE_message.play({ loop: false });
                    if (text[i] === '\n') { resolve(); }
                    i++;
                },
                repeat: text.length - 1,
                delay: 50
            })
        })
    }

    //テキストのスクロールとクリアを実行する
    public textScroll(scene: Phaser.Scene, textObject: Phaser.GameObjects.Text, clickZone: Phaser.GameObjects.Zone, lineCount: number, allLineCount: number, textLine: number) {
        this.textObject = textObject;
        const keyCode: string = 'keydown-A';
        const pointerOperation: string = 'pointerdown';

        return new Promise<void>(resolve => {

            if (allLineCount - lineCount > 0 && lineCount % textLine === 0) {
                //次の行が存在し、現在の行数が2だった場合はスクロールする

                //ゾーンをクリックするとテキストがスクロールされる
                clickZone.once(pointerOperation, () => {//一回限りのイベント
                    scene.input.keyboard!.off(keyCode);//キー入力OFF
                    (async () => {
                        await this._scrollTween(scene, textObject);
                        resolve();
                    })();
                });

                //「A」キーを押下するとテキストがスクロールされる
                scene.input.keyboard!.once(keyCode, () => {//一回限りのイベント
                    clickZone.off(pointerOperation);//マウス入力OFF
                    (async () => {
                        await this._scrollTween(scene, textObject);
                        resolve();
                    })();
                });

            } else if (allLineCount - lineCount === 0) {

                //現在の行で終了の場合はテキストをクリアする
                clickZone.once(pointerOperation, () => {//一回限りのイベント
                    scene.input.keyboard!.off(keyCode);//キー入力OFF
                    if (this.usePatern === 'BubbleTalk') {
                        textObject.text = '';
                        (async () => {
                            await this._deleteTween(scene, this.messageObjectList);
                            resolve();
                        })();
                    } else {
                        // textObject.text = '';
                        this.deleteObject()
                        resolve();
                    }
                });

                scene.input.keyboard!.once(keyCode, () => {//一回限りのイベント
                    clickZone.off(pointerOperation);//マウス入力OFF
                    if (this.usePatern === 'BubbleTalk') {
                        textObject.text = '';
                        (async () => {
                            await this._deleteTween(scene, this.messageObjectList);
                            resolve();
                        })();
                    } else {
                        // textObject.text = '';
                        this.deleteObject()
                        resolve();
                    }
                });


            } else {
                //現在行が1行目の場合、続けて2行目を表示
                resolve();
            }
        })
    }

    _scrollTween(scene: Phaser.Scene, textObject: Phaser.GameObjects.Text) {

        return new Promise<void>(resolve => {
            //テキストの初期位置
            const defaultY = textObject.y;

            //スクロール量の設定
            const scrollY = defaultY - (textObject.height + 10);

            //スクロール
            this.scrollTweenObject = scene.tweens.add({
                targets: textObject,
                y: scrollY,
                ease: 'sine.inout',
                duration: 500,
                onComplete: () => {
                    textObject.text = '';//テキストをクリア
                    textObject.y = defaultY;//y座標を戻す
                    resolve();
                }
            });
        })
    }

    _deleteTween(scene: Phaser.Scene, deleteMessageObject: Phaser.GameObjects.GameObject[]) {//tweenはタイマー、リピート等の使い方をしなければGCで自動削除される。
        return new Promise<void>(resolve => {
            scene.tweens.add({
                targets: deleteMessageObject,//テキスト及び吹き出しオブジェクトを画面から削除
                scale: 0,
                x: (scene as GameScene).getPlayer().x,
                y: (scene as GameScene).getPlayer().y,
                ease: 'sine.inout',
                duration: 200,
                onComplete: () => {
                    resolve();
                }
            });
        })
    }

    public async deleteObject(): Promise<void> {
        if (this.deleteMessageFlg) {
            for (const obj of this.messageObjectList) {
                obj.destroy();
            }
        }
    }

    public setDeleteMessageFlg(flg: boolean) {
        this.deleteMessageFlg = flg;
    }

    //再設定
    private reSetting() {

        //会話終了後、クリック操作などを再設定
        this.typeWriterObject.destroy();
        this.scrollTweenObject = null;//基本的にtweenは自動的にGC対象となるためdestroy()するとExceptionとなる。
    }
}
