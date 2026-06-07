import { Sound } from "../../scenes/Sound";
import { BattleMessageWindow } from "../view/BattleMessageWindow";
import { SkillDetail } from "../../lib/types";

export default class PlayerGuard {
    private battleScene: Phaser.Scene;
    private battler: Phaser.GameObjects.Sprite;
    private targetEnemy: Phaser.GameObjects.Image;
    attackDuration = 300;

    private soundScene: Sound;

    //現状は単体選択のみ対応
    constructor(battleScene: Phaser.Scene) {
        this.battleScene = battleScene;

        //BGM開始はNpcCommonで実行しているが、sceneと役割を考えると改良した方が良い
        this.soundScene = this.battleScene.scene.get('Sound') as Sound;
    }

    public guard(battleMessageWindow: BattleMessageWindow, battler: Phaser.GameObjects.Sprite) {
        return new Promise<void>(resolve => {
            if (battler.data.values.HP <= 0) return resolve();
            this.battler = battler;

            //ガード値を設定
            // スキルが未設定（オート時など）の場合は基本防御力をそのままボーナスとして設定
            const skillDetail: SkillDetail = this.battler.getData('UseSkill');
            const baseGuard = this.battler.getData('Guard') || 0;
            const skillValue = skillDetail?.value || baseGuard; 
            
            this.battler.setData('GuardValue', skillValue);

            (async () => {

                await battleMessageWindow.messageOutput(this.battler.getData('name') + 'は身構えた！', undefined)

                await new Promise<void>(resolve => {
                    this.battleScene.time.delayedCall(600, () => {
                        resolve();
                    }, [], this.battleScene);
                })

                resolve();
            })();
        })
    }

    //攻撃エフェクト
    // private attackTween(effect: Phaser.GameObjects.Sprite) {
    //     this.soundScene.SE_fire.play();
    //     return new Promise<void>(resolve => {
    //         const tween = this.battleScene.tweens.add({
    //             targets: effect,
    //             scale: 2,
    //             ease: 'sine.inout',
    //             repeat: 2,
    //             yoyo: true,
    //             duration: this.attackDuration,
    //             onComplete: () => {
    //                 resolve();
    //                 this.soundScene.SE_fire.stop();
    //                 tween.destroy();
    //             }
    //         });
    //     })
    // }

    //フェードアウト
    // private deleteEnemy(target: Phaser.GameObjects.Image) {
    //     return new Promise<void>(resolve => {
    //         this.battleScene.tweens.addCounter({//このtweenはオブジェクトをターゲットとせず、設定した値を更新し続ける
    //             from: 1,
    //             to: 0,
    //             duration: 100,
    //             ease: 'linear',
    //             onUpdate: (tween) => {
    //                 //取得した値をセットする
    //                 target.setAlpha(tween.getValue()!);
    //                 target.getData('backGaugeHP').setAlpha(tween.getValue());
    //                 target.getData('gaugeHP').setAlpha(tween.getValue());
    //                 resolve();
    //             },
    //         });
    //     })
    // }
}