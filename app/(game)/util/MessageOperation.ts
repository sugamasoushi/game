import { GameScene, EventScene } from '../lib/types';
import { Sound } from '../scenes/Sound';
import { InputManager } from '@/app/(game)/core/input/InputManager';
import { Subscription } from "rxjs";
import { take } from "rxjs/operators";
import { filter } from "rxjs/operators";

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
    private subs = new Subscription();

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
    public async typeWriter(scene: Phaser.Scene, textObject: Phaser.GameObjects.Text, text: string, clickZone?: Phaser.GameObjects.Zone) {
        const inputManager = InputManager.getInstance(scene);

        return new Promise<void>(resolve => {
            let i = 0;
            let isSkipped = false;

            const skipTypeWriter = () => {
                if (isSkipped) return;
                isSkipped = true;

                if (this.typeWriterObject) {
                    this.typeWriterObject.destroy();
                }

                if (sub) sub.unsubscribe();
                if (clickZone) clickZone.off('pointerdown', skipTypeWriter);

                // 残りの文字列を一気に表示（\n がある場合はそこまで）
                const remainingText = text.substring(i);
                const newlineIndex = remainingText.indexOf('\n');
                if (newlineIndex !== -1) {
                    textObject.text += remainingText.substring(0, newlineIndex + 1);
                } else {
                    textObject.text += remainingText;
                }

                resolve();
            };

            const sub = inputManager.decideButton$.pipe(
                filter(() => scene.sys.isActive()),
                take(1)
            ).subscribe(() => {
                skipTypeWriter();
            });

            if (clickZone) {
                clickZone.once('pointerdown', skipTypeWriter);
            }

            this.typeWriterObject = scene.time.addEvent({
                callback: () => {
                    if (isSkipped) return;
                    textObject.text += text[i];
                    this.soundScene.SE_message.play({ loop: false });
                    
                    if (text[i] === '\n') { 
                        if (sub) sub.unsubscribe();
                        if (clickZone) clickZone.off('pointerdown', skipTypeWriter);
                        resolve(); 
                        return;
                    }
                    i++;

                    if (i >= text.length) {
                        if (sub) sub.unsubscribe();
                        if (clickZone) clickZone.off('pointerdown', skipTypeWriter);
                        resolve();
                    }
                },
                repeat: text.length - 1,
                delay: 50
            });
        });
    }

    //テキストのスクロールとクリアを実行する
    public textScroll(scene: Phaser.Scene, textObject: Phaser.GameObjects.Text, clickZone: Phaser.GameObjects.Zone, lineCount: number, allLineCount: number, textLine: number) {
        this.textObject = textObject;
        const pointerOperation: string = 'pointerdown';
        const inputManager = InputManager.getInstance(scene);

        return new Promise<void>(resolve => {

            if (allLineCount - lineCount > 0 && lineCount % textLine === 0) {
                //次の行が存在し、現在の行数が2だった場合はスクロールする

                //決定ボタン（スペース、仮想パッド〇、ゲームパッド〇）でスクロール
                this.subs.add(inputManager.decideButton$.pipe(
                    filter(() => scene.sys.isActive()),//シーンがアクティブであることを確認
                    take(1)
                ).subscribe(() => {//take(1) オペレータを使用し、1回だけ通知を受け取る安全なサブスクリプション
                    clickZone.off(pointerOperation);//マウス入力OFF
                    (async () => {
                        await this._scrollTween(scene, textObject);
                        resolve();
                    })();
                }));

                //ゾーンをクリックするとテキストがスクロールされる
                clickZone.once(pointerOperation, () => {//一回限りのイベント
                    this.subs.unsubscribe();//購読解除
                    this.subs = new Subscription(); // 再初期化
                    (async () => {
                        await this._scrollTween(scene, textObject);
                        resolve();
                    })();
                });

            } else if (allLineCount - lineCount === 0) {

                //現在の行で終了の場合はテキストをクリアする
                this.subs.add(inputManager.decideButton$.pipe(
                    filter(() => scene.sys.isActive()),//シーンがアクティブであることを確認
                    take(1)
                ).subscribe(() => {
                    clickZone.off(pointerOperation);//マウス入力OFF
                    if (this.usePatern === 'BubbleTalk') {
                        textObject.text = '';
                        (async () => {
                            await this._deleteTween(scene, this.messageObjectList);
                            resolve();
                        })();
                    } else {
                        this.deleteObject()
                        resolve();
                    }
                }));

                //ゾーンをクリックするとテキストがクリアされる
                clickZone.once(pointerOperation, () => {//一回限りのイベント
                    this.subs.unsubscribe();//購読解除
                    this.subs = new Subscription(); // 再初期化
                    if (this.usePatern === 'BubbleTalk') {
                        textObject.text = '';
                        (async () => {
                            await this._deleteTween(scene, this.messageObjectList);
                            resolve();
                        })();
                    } else {
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
    public reSetting() {
        this.subs.unsubscribe();
        this.subs = new Subscription(); // 次回利用のために再初期化
        this.cleanupTweens();
    }

    //完全破棄
    public destroy() {
        this.subs.unsubscribe();
        this.cleanupTweens();
    }

    private cleanupTweens() {
        if (this.typeWriterObject) {
            this.typeWriterObject.destroy();
        }
        this.scrollTweenObject = null;//基本的にtweenは自動的にGC対象となるためdestroy()するとExceptionとなる。
    }
}
