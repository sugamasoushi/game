import { Sound } from "../../scenes/Sound";
import { SkillDetail } from "../../lib/SkillDataTypes";
import { BattleMessageWindow } from "../view/BattleMessageWindow";
import { NormalAttack } from "../../util/Sprite/NormalAttack";
import { SearchMagicEffect } from "./SearchMagicEffect";

export default class PlayerAttack {
    private attacker: Phaser.GameObjects.Sprite;
    private targetEnemy: Phaser.GameObjects.Image;
    attackDuration = 300;

    private soundScene: Sound;

    //現状は単体選択のみ対応
    constructor(private battleScene: Phaser.Scene) {
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

            const skillType = this.attacker.getData('SkillType');
            const skillDetail: SkillDetail = this.attacker.getData('UseSkill');

            (async () => {
                await Promise.all([
                    battleMessageWindow.messageOutput(this.attacker.getData('Name') + 'の攻撃！', undefined),

                    (() => {
                        if (skillType) {
                            switch (skillType) {
                                case 'special':

                                case 'magic':
                                    // console.log(skillDetail);
                                    const searchMagicEffect = new SearchMagicEffect(skillDetail, this.battleScene, targetX, targetY);
                                    const effect = searchMagicEffect.searchMagicEffect();
                                    this.attacker.data.values.MP -= skillDetail.mpCost;
                                    return effect!.attackAnimationBattle();
                                default:
                                    return Promise.resolve();
                            }
                        } else {
                            const effect = new NormalAttack(this.battleScene, targetX, targetY);
                            return effect.attackAnimationBattle();
                        }
                    })(),

                    this.leanBack(this.targetEnemy)
                ]);
                //ダメージ計算処理
                // (自身の攻撃力 + スキル威力) - (ターゲットのガード値)
                const baseAttack = this.attacker.getData('Attack') || 0;
                const skillValue = skillDetail?.value || 0;
                const guardBonus = this.targetEnemy.getData('GuardValue') || 0;

                const totalAttack = baseAttack + skillValue;
                const damage = Math.max(totalAttack - guardBonus, 1);

                await Promise.all([
                    battleMessageWindow.messageOutput(this.targetEnemy.getData('Name') + 'に' + damage + 'のダメージ！', undefined),
                    this.blinking(this.targetEnemy)
                ]);

                //HP更新
                this.targetEnemy.data.values.HP -= damage;

                //HPチェック
                if (this.targetEnemy.data.values.HP <= 0) {
                    this.targetEnemy.data.values.HP = 0;
                    battleMessageWindow.messageOutput(this.targetEnemy.getData('Name') + 'を倒した！', 600);
                    await this.deleteEnemy(this.targetEnemy);
                }

                //攻撃対象を初期化
                this.attacker.setData('BattleTarget', undefined);

                await new Promise<void>(resolve => {
                    this.battleScene.time.delayedCall(600, () => {
                        resolve();
                    }, [], this.battleScene);
                })

                resolve();
            })();
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
        this.soundScene.playSe('SE_attack');
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
                        // this.soundScene.playSe('SE_attack').stop();
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