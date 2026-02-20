import { MagicFrame } from "@/app/(game)/util/Effect/MagicFrame";
import { Player } from "../Player";
import { GameScene } from "@/app/(game)/lib/types";
import { Npc } from "../Npc";
import { CharacterGameObject } from '../../../../event/view/CharacterGameObject';

export class FieldAttack {
    private gameScene: GameScene;
    private characterGameObject: CharacterGameObject
    private effect: MagicFrame;
    private sprite: Player;
    private x: number;
    private y: number;
    private attackDuration = 300;

    constructor(sprite: Player, x: number, y: number) {
        this.gameScene = sprite.scene as GameScene;
        this.sprite = sprite;
        this.x = x;
        this.y = y;

        this.characterGameObject = new CharacterGameObject();
    }

    frameBullet(x: number, y: number) {
        this.x = x;
        this.y = y;

        const operator: { operatorX: number, operatorY: number } = this.sprite.getDirection();
        this.effect = new MagicFrame(this.gameScene, this.x, this.y, this.attackDuration, this.sprite);

        this.attack();
        this.attackTween(operator.operatorX, operator.operatorY);
    }

    private attack() {
        const fieldEnemyList = this.characterGameObject.getFieldEnemyList(this.gameScene);

        if (fieldEnemyList) {
            fieldEnemyList.forEach(enemy => {
                const hitEvent = this.gameScene.physics.add.overlap(this.effect, enemy,
                    () => {
                        //console.log('overlapCallback');
                        enemy.data.values.HP -= 10;
                        this.hitAction(enemy);
                        hitEvent.destroy();//重なった状態だと常に処理され続けるため、一回目処理後にoverlapを削除する。
                    },
                    () => {
                        //console.log('processCallback')
                        return true;
                        //return false;//falseだとoverlapCallback()が処理されない
                    });
            }, null);
        }
    }

    private attackTween(operatorX: number, operatorY: number) {
        //スクロール
        this.gameScene.tweens.add({
            targets: this.effect,
            x: this.x + 100 * operatorX,
            y: this.y + 100 * operatorY,
            ease: 'sine.inout',
            duration: this.attackDuration,
            onComplete: () => {
                //this.effect.destroy();
            }
        });
    }

    private hitAction(enemy: Npc) {
        let flag = true;
        this.gameScene.time.addEvent(
            {
                delay: 50,
                callback: () => {
                    if (flag) {
                        flag = !flag;
                        enemy.setAlpha(0.5);
                    } else {
                        flag = !flag;
                        enemy.setAlpha(1);
                    }
                },
                callbackScope: this.gameScene,
                repeat: 3,
            });
    }

}

/**
* ※挙動メモ
* overlapを作成した際、以下のように挙動が異なる
* 1.衝突時、overlapに渡した関数を即実行し破棄する
* 2.衝突時、overlapに渡した関数を即実行し破棄するが、未衝突の場合は関数を処理せず残す
*
* ■実装
* 1.
* this.scene.physics.add.overlap(this, enemy,() => {},() => {});
*
* 2.
* this.scene.physics.add.overlap(object1,object2)
* this.scene.physics.world.once('overlap', (object1,object2) => {});
*
* 2.は敵にヒットしなかった場合は処理されず、未ヒット時の処理は残ったままとなる。
* これは次回衝突時に処理されることになる。
* 例えば2回ヒットしない状態で3回目がヒットした場合、3回目で3回処理されることになる。
*/

//引数は全部で(gameObject1, gameObject2, body1, body2)となる
//gameObject1・・・frameのsprite
//gameObject2・・・enemyのsprite
// this.hitEvent = this.scene.physics.world.once('overlap', (frame, enemy) => {
//     enemy.data.values.HP -= 10;
//     console.log("hit");
//     console.log(this.hitEvent)
//     //enemy.setAlpha(0.5);
// });