import { Sound } from "../../scenes/Sound";
import { BattleMessageWindow } from "../view/BattleMessageWindow";

export default class EnemyAttack {
    private battleScene: Phaser.Scene;
    private attacker: Phaser.GameObjects.Image;
    private target: Phaser.GameObjects.Sprite;

    private soundScene: Sound;

    //現状は単体選択のみ対応
    constructor(battleScene: Phaser.Scene) {
        this.battleScene = battleScene;
        this.soundScene = this.battleScene.scene.get('Sound') as Sound;
    }

    //仮、通常攻撃のエフェクトは別途作成する
    public attack(battleMessageWindow: BattleMessageWindow, attacker: Phaser.GameObjects.Image) {
        return new Promise<void>(resolve => {
            if (attacker.data.values.HP <= 0) return resolve();
            this.attacker = attacker;
            this.target = attacker.getData('BattleTarget');
            const targetIcon = attacker.getData('BattleTargetIcon');

            (async () => {
                await Promise.all([
                    battleMessageWindow.messageOutput(this.attacker.getData('name') + 'の攻撃！', undefined),
                    await this.attackTween(),
                    this.leanBack()
                ]);

                await Promise.all([
                    battleMessageWindow.messageOutput(this.target.getData('name') + 'に' + this.attacker.getData('Attack') + 'のダメージ！', undefined),
                    this.blinking(targetIcon)
                ]);

                this.target.data.values.HP -= this.attacker.getData('Attack');
                if (this.target.data.values.HP <= 0) {
                    this.target.data.values.HP = 0;
                }

                //攻撃対象を初期化
                this.attacker.setData('BattleTarget', undefined);

                await new Promise<void>(resolve => {
                    setTimeout(() => {
                        resolve();
                    }, 500);
                })

                resolve();
            })();
        })
    }

    //通常攻撃エフェクト
    private attackTween() {
        console.log('attackTween')
        return new Promise<void>(resolve => {
            const tween = this.battleScene.tweens.add({
                targets: this.attacker,
                scale: this.attacker.scaleX + 0.02,
                ease: 'sine.inout',
                yoyo: true,
                duration: 100,
                delay: 500,
                onComplete: () => {
                    resolve();
                    // tween.destroy();
                }
            });
        })
    }

    //画面効果
    private leanBack() {
        this.soundScene.SE_punch.play();
        return new Promise<void>(resolve => {
            this.battleScene.cameras.main.shake(100, 0.02);
            setTimeout(() => {
                // this.soundScene.punchSE.stop();
                resolve();
            }, 500);
        });
    }

    //相手点滅
    private blinking(target: Phaser.GameObjects.Image) {
        this.soundScene.SE_attack.play();

        return new Promise<void>(resolve => {
            let flag = true;
            const timer = this.battleScene.time.addEvent({
                delay: 100,
                callback: () => {
                    if (flag) {
                        flag = !flag;
                        target.setAlpha(0.5);
                    } else {
                        flag = !flag;
                        target.setAlpha(1);
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

}