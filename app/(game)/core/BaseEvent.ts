import { Eventer, EventObjState } from "../lib/types";
import { Event } from "../scenes/Event";
import { Player } from "../field/view/character/Player";
import { Npc } from "../field/view/character/Npc";
import { gameStateManager } from "../core/GameStateManager";
import { State } from "../lib/StateTypes";

//イベントクラスの基底クラス
export class BaseEvent implements Eventer {
    protected eventScene: Event;
    protected eventObject: Phaser.Physics.Arcade.Sprite;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        this.eventScene = eventScene;
        this.eventObject = eventObject;
    }

    protected get isGameOver(): boolean {
        return gameStateManager.currentState === State.GAMEOVER;
    }

    //オーバーライド
    public init() { };

    //オーバーライド
    public async execEvent() { }

    //完了時の処理
    protected eventEnd() { }

    //破棄時の処理
    public destroy() { }

    //イベントオブジェクト検索
    protected switchingEventObjFlg(name: string, state: boolean) {
        const gameScene = this.eventScene.scene.get('Field');

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

    //キャラクターを目標Y座標まで上方向に移動する
    protected characterMovingUP(sprite: Player | Npc, distanceY: number, speed?: number | undefined, animationFlg?: boolean | undefined) {
        // 移動スピード（1秒間に動くピクセル数）
        const moveSpeed = speed ? speed : 100;

        // アニメーションフラグ
        const defaultAnimationFlg = animationFlg !== undefined ? animationFlg : true;

        // 距離をスピードで割って、必要な時間（ミリ秒）を算出
        const duration = (distanceY / moveSpeed) * 1000;

        return new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: sprite,
                y: sprite.y - distanceY,
                duration: duration,
                ease: 'Linear', // 等速移動
                onStart: () => {
                    if (defaultAnimationFlg === true) { sprite.setAnimDirection('walk_up'); }
                },
                onComplete: () => {
                    sprite.setVelocity(0, 0); // 物理体がある場合は速度をリセット
                    sprite.stopAnimation();   // アニメーション停止
                    resolve();
                }
            });
        });
    }

    //キャラクターを目標Y座標まで下方向に移動する
    protected characterMovingDOWN(sprite: Player | Npc, distanceY: number, speed?: number | undefined, animationFlg?: boolean | undefined) {

        // 移動スピード（1秒間に動くピクセル数）
        const moveSpeed = speed ? speed : 100;

        // アニメーションフラグ
        const defaultAnimationFlg = animationFlg !== undefined ? animationFlg : true;

        // 距離をスピードで割って、必要な時間（ミリ秒）を算出
        const duration = (distanceY / moveSpeed) * 1000;

        return new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: sprite,
                y: sprite.y + distanceY,
                duration: duration,
                ease: 'Linear', // これで完全等速になる
                onStart: () => {
                    if (defaultAnimationFlg === true) { sprite.setAnimDirection('walk_down'); }
                },
                onComplete: () => {
                    sprite.setVelocity(0, 0); // 物理体がある場合は速度をリセット
                    sprite.stopAnimation();   // アニメーション停止
                    resolve();
                }
            });
        });
    }

    //キャラクターを目標X座標まで左方向に移動する
    protected characterMovingLEFT(sprite: Player | Npc, distanceX: number, speed?: number | undefined, animationFlg?: boolean | undefined) {

        // 移動スピード（1秒間に動くピクセル数）
        const moveSpeed = speed ? speed : 100;

        // アニメーションフラグ
        const defaultAnimationFlg = animationFlg !== undefined ? animationFlg : true;

        // 距離をスピードで割って、必要な時間（ミリ秒）を算出
        const duration = (distanceX / moveSpeed) * 1000;

        return new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: sprite,
                x: sprite.x - distanceX,
                duration: duration,
                ease: 'Linear', // これで完全等速になる
                onStart: () => {
                    if (defaultAnimationFlg === true) { sprite.setAnimDirection('walk_left'); }
                },
                onComplete: () => {
                    sprite.setVelocity(0, 0); // 物理体がある場合は速度をリセット
                    sprite.stopAnimation();   // アニメーション停止
                    resolve();                // 移動完了を通知
                }
            });
        });
    }

    //キャラクターを目標X座標まで左方向に移動する
    protected characterMovingRIGHT(sprite: Player | Npc, distanceX: number, speed?: number | undefined, animationFlg?: boolean | undefined) {

        // 移動スピード（1秒間に動くピクセル数）
        const moveSpeed = speed ? speed : 100;

        // アニメーションフラグ
        const defaultAnimationFlg = animationFlg !== undefined ? animationFlg : true;

        // 距離をスピードで割って、必要な時間（ミリ秒）を算出
        const duration = (distanceX / moveSpeed) * 1000;

        return new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: sprite,
                x: sprite.x + distanceX,
                duration: duration,
                ease: 'Linear', // これで完全等速になる
                onStart: () => {
                    if (defaultAnimationFlg === true) { sprite.setAnimDirection('walk_right'); }
                },
                onComplete: () => {
                    sprite.setVelocity(0, 0); // 物理体がある場合は速度をリセット
                    sprite.stopAnimation();   // アニメーション停止
                    resolve();                // 移動完了を通知
                }
            });
        });
    }

    //キャラクターを目標座標まで移動する
    protected characterMoving(sprite: Player | Npc, targetX: number, targetY: number, animationKey: string, speed?: number | undefined) {
        // walk_up
        // walk_down
        // walk_left
        // walk_right

        // 移動スピード（1秒間に動くピクセル数）
        const moveSpeed = speed ? speed : 100;

        // 現在地から目的地までの距離を計算
        const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, targetX, targetY);

        // 距離をスピードで割って、必要な時間（ミリ秒）を算出
        const duration = (distance / moveSpeed) * 1000;

        return new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: sprite,
                x: targetX,
                y: targetY,
                duration: duration,
                ease: 'Linear', // これで完全等速になる
                onStart: () => {
                    sprite.setAnimDirection(animationKey); // アニメーション開始
                },
                onComplete: () => {
                    sprite.setVelocity(0, 0); // 物理体がある場合は速度をリセット
                    sprite.stopAnimation();   // アニメーション停止
                    resolve();                // 移動完了を通知
                }
            });
        });
    }


    protected stopAnyTime(duration: number) {
        return new Promise<void>(resolve => {
            this.eventScene.time.delayedCall(duration, () => {
                resolve();
            }, [], this.eventScene);
        });
    }

    protected execFadeIn() {
        return new Promise<void>(resolve => {
            this.eventScene.cameras.main.once('camerafadeincomplete', () => {
                resolve();
            });

            this.eventScene.cameras.main.fadeIn(200);
        });
    }

    protected execFadeOut() {
        return new Promise<void>(resolve => {
            this.eventScene.cameras.main.once('camerafadeoutcomplete', () => {
                resolve();
            });

            this.eventScene.cameras.main.fadeOut(400);
        });
    }
}