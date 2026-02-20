import { Sound } from "../../scenes/Sound";
import { MagicFrame } from "../../util/Effect/MagicFrame";
import { BattleMessageWindow } from "../view/BattleMessageWindow";

export default class PlayerAttack {
    private battleScene: Phaser.Scene;
    private attacker: Phaser.GameObjects.Sprite;
    private targetEnemy: Phaser.GameObjects.Image;
    attackDuration = 300;

    private soundScene: Sound;

    //現状は単体選択のみ対応
    constructor(battleScene: Phaser.Scene) {
        this.battleScene = battleScene;

        //BGM開始はNpcCommonで実行しているが、sceneと役割を考えると改良した方が良い
        this.soundScene = this.battleScene.scene.get('Sound') as Sound;
    }

    //仮、通常攻撃のエフェクトは別途作成する
    //攻撃者のデータから目標を取得して処理する
    public attack(battleMessageWindow: BattleMessageWindow, attacker: Phaser.GameObjects.Sprite) {
        return new Promise<void>(resolve => {
            if (attacker.data.values.HP <= 0) return resolve();
            this.attacker = attacker;
            this.targetEnemy = attacker.getData('BattleTarget');

            const worldPoint = this.targetEnemy.getWorldTransformMatrix().transformPoint(0, 0);
            const targetX = worldPoint.x + (this.targetEnemy.width / 2);
            const targetY = worldPoint.y + (this.targetEnemy.height / 2);

            const effect = new MagicFrame(this.battleScene, targetX, targetY, this.attackDuration, undefined);

            (async () => {
                await Promise.all([
                    battleMessageWindow.messageOutput(this.attacker.getData('name') + 'の攻撃！', undefined),
                    effect.attackAnimation(),
                    this.attackTween(effect),

                    this.leanBack(this.targetEnemy)
                ]);
                await Promise.all([
                    battleMessageWindow.messageOutput(this.targetEnemy.getData('name') + 'に' + this.attacker.getData('Attack') + 'のダメージ！', undefined),
                    this.blinking(this.targetEnemy)
                ]);

                //計算処理
                this.targetEnemy.data.values.HP -= this.attacker.getData('Attack');

                //HPチェック
                if (this.targetEnemy.data.values.HP <= 0) {
                    this.targetEnemy.data.values.HP = 0;
                    battleMessageWindow.messageOutput(this.targetEnemy.getData('name') + 'を倒した！', 600);
                    await this.deleteEnemy(this.targetEnemy);
                }

                //攻撃対象を初期化
                this.attacker.setData('BattleTarget', undefined);

                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, 600);
                })

                resolve();
            })();
        })
    }

    //攻撃エフェクト
    private attackTween(effect: Phaser.GameObjects.Sprite) {
        this.soundScene.SE_fire.play();
        return new Promise<void>(resolve => {
            const tween = this.battleScene.tweens.add({
                targets: effect,
                scale: 2,
                ease: 'sine.inout',
                repeat: 2,
                yoyo: true,
                duration: this.attackDuration,
                onComplete: () => {
                    resolve();
                    this.soundScene.SE_fire.stop();
                    tween.destroy();
                }
            });
        })
    }

    //相手仰け反り
    private leanBack(enemy: Phaser.GameObjects.Image) {
        return new Promise<void>(resolve => {
            const tween = this.battleScene.tweens.add({
                targets: enemy,
                y: enemy.y - 20,
                ease: 'sine.inout',
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    resolve();
                    tween.destroy();
                }
            });
        });
    }

    //相手点滅
    private blinking(enemy: Phaser.GameObjects.Image) {
        this.soundScene.SE_attack.play();
        return new Promise<void>(resolve => {
            let flag = true;
            const timer = this.battleScene.time.addEvent({
                delay: 100,
                callback: () => {
                    if (flag) {
                        flag = !flag;
                        enemy.setAlpha(0.5);
                    } else {
                        flag = !flag;
                        enemy.setAlpha(1);
                    }
                    if (timer.repeatCount === 0) {
                        // this.soundScene.attackSE.stop();
                        resolve();
                    }
                },
                callbackScope: this.battleScene,
                repeat: 3,
            });
        })
    }

    //フェードアウト
    private deleteEnemy(target: Phaser.GameObjects.Image) {
        return new Promise<void>(resolve => {
            this.battleScene.tweens.addCounter({//このtweenはオブジェクトをターゲットとせず、設定した値を更新し続ける
                from: 1,
                to: 0,
                duration: 100,
                ease: 'linear',
                onUpdate: (tween) => {
                    //取得した値をセットする
                    target.setAlpha(tween.getValue()!);
                    target.getData('backGaugeHP').setAlpha(tween.getValue());
                    target.getData('gaugeHP').setAlpha(tween.getValue());
                    resolve();
                },
            });
        })
    }
}