import { Eventer, EventObjState } from "../lib/types";
import { Event } from "../scenes/Event";
import { Player } from "../gamemain/view/character/Player";
import { Npc } from "../gamemain/view/character/Npc";

//イベントクラスの基底クラス
export class BaseEvent implements Eventer {
    protected eventScene: Event;
    protected eventObject: Phaser.Physics.Arcade.Sprite;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        this.eventScene = eventScene;
        this.eventObject = eventObject;
    }

    //オーバーライド
    public init() { };

    //オーバーライド
    public async execEvent() { }

    //完了時の処理
    protected eventEnd() { }

    //イベントオブジェクト検索
    protected serchEventObj(name: string, state: boolean) {
        const gameScene = this.eventScene.scene.get('Game');

        //イベントが完了してない場合は衝突判定をOFFにしておく
        gameScene.children.list.forEach(obj => {
            if (obj.name === name) {
                if (state === true) {
                    //衝突判定をON
                    obj.state = EventObjState.true;
                    (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 1;//衝突判定のON/OFFを切り替える
                } else {
                    //衝突判定をOFF
                    obj.state = EventObjState.false;
                    (obj.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える
                }
            }
        });
    }

    //キャラクターの立ち絵をスクロール
    public scrollImage(image: Phaser.GameObjects.Image, moveToX: number, duration: number) {
        return new Promise<void>(resolve => {
            //setTintでグレーに設定、Phaser.Display.Color.GetColor()でRGB指定が可能
            image.setTint(Phaser.Display.Color.GetColor(128, 128, 128));

            //画面外からスクロール
            image.scene.tweens.add({
                targets: image,
                x: moveToX,
                ease: 'sine.out',
                duration: duration,
                onComplete: () => {
                    resolve();
                }
            });
        })
    }

    //キャラクターを目標Y座標まで移動する
    // protected characterMovingY(sprite: Player | Npc, moveY: number, velocityY: number, animation: boolean) {

    //     return new Promise<void>(resolve => {

    //         //移動
    //         sprite.moveY(moveY, velocityY, animation);


    //         let deirection = '';
    //         if (moveY - sprite.y < 0) {
    //             deirection = 'up';
    //         } else {
    //             deirection = 'down';
    //         }

    //         //座標をチェック
    //         const check = setInterval(//一定時間毎にメソッドを実行する
    //             () => {
    //                 //移動先座標との差が1未満の場合は停止
    //                 if (Phaser.Math.Difference(moveY, sprite.y) < 4) {
    //                     sprite.body.setVelocity(0, 0);
    //                     sprite.stopAnimation();
    //                     clearInterval(check);//setInterval()をクリア
    //                     resolve();
    //                 }

    //             }, 10)//10/1000ミリ秒毎（最低値）
    //     })
    // }

    //キャラクターを目標Y座標まで上方向に移動する
    protected characterMovingUP(sprite: Player | Npc, moveY: number, velocityY: number, animation: boolean) {

        //移動先座標がスプライト位置より上の場合
        if (moveY - sprite.y < 0) {
            return new Promise<void>(resolve => {

                sprite.setVelocityY(-1 * velocityY);
                if (animation === true) {
                    sprite.setAnimDirection('walk_up');
                }

                //座標をチェック
                const check = setInterval(//一定時間毎にメソッドを実行する
                    () => {
                        //移動先座標を超えたら停止
                        if (moveY > sprite.y) {
                            sprite.setVelocityY(0);
                            sprite.stopAnimation();
                            clearInterval(check);//setInterval()をクリア
                            resolve();
                        }
                    }, 10)//10/1000ミリ秒毎（最低値）
            })
        } else {
            console.log('座標位置エラー')
        }
    }

    //キャラクターを目標Y座標まで下方向に移動する
    protected characterMovingDOWN(sprite: Player | Npc, moveY: number, velocityY: number, animation: boolean) {
        //移動先座標がスプライト位置より上の場合
        if (moveY - sprite.y > 0) {
            return new Promise<void>(resolve => {

                sprite.setVelocityY(1 * velocityY);
                if (animation === true) {
                    sprite.setAnimDirection('walk_down');
                }

                //座標をチェック
                const check = setInterval(//一定時間毎にメソッドを実行する
                    () => {
                        //移動先座標を超えたら停止
                        if (moveY < sprite.y) {
                            sprite.setVelocityY(0);
                            sprite.stopAnimation();
                            clearInterval(check);//setInterval()をクリア
                            resolve();
                        }
                    }, 10)//10/1000ミリ秒毎（最低値）
            })
        } else {
            console.log('座標位置エラー')
        }
    }

    //キャラクターを目標X座標まで左方向に移動する
    protected characterMovingLEFT(sprite: Player | Npc, moveX: number, velocityX: number, animation: boolean) {

        //移動先座標がスプライト位置より右の場合
        if (moveX - sprite.x < 0) {
            return new Promise<void>(resolve => {

                sprite.setVelocityX(-1 * velocityX);
                if (animation === true) {
                    sprite.setAnimDirection('walk_left');
                }

                //座標をチェック
                const check = setInterval(//一定時間毎にメソッドを実行する
                    () => {
                        //移動先座標を超えたら停止
                        if (moveX > sprite.x) {
                            sprite.setVelocityX(0);
                            sprite.stopAnimation();
                            clearInterval(check);//setInterval()をクリア
                            resolve();
                        }
                    }, 10)//10/1000ミリ秒毎（最低値）
            })
        } else {
            console.log('座標位置エラー')
        }
    }

    //キャラクターを目標X座標まで左方向に移動する
    protected characterMovingRIGHT(sprite: Player | Npc, moveX: number, velocityX: number, animation: boolean) {

        //移動先座標がスプライト位置より左の場合
        if (moveX - sprite.x > 0) {
            return new Promise<void>(resolve => {

                sprite.setVelocityX(1 * velocityX);
                if (animation === true) {
                    sprite.setAnimDirection('walk_right');
                }

                //座標をチェック
                const check = setInterval(//一定時間毎にメソッドを実行する
                    () => {
                        //移動先座標を超えたら停止
                        if (moveX < sprite.x) {
                            sprite.setVelocityX(0);
                            sprite.stopAnimation();
                            clearInterval(check);//setInterval()をクリア
                            resolve();
                        }
                    }, 10)//10/1000ミリ秒毎（最低値）
            })
        } else {
            console.log('座標位置エラー')
        }
    }
}