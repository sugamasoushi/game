import { EffectCommon } from "./EffectCommon";
import { Sound } from "../../../scenes/Sound";

export class MagicFrame extends EffectCommon {
    private soundScene: Sound;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'flames32');
        this.name = 'MagicFrame';
        this.attackDuration = 250;
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    //アニメーション設定
    override animationSetting(texture: string) {
        this.frameRateValue = 10

        this.anims.create({
            key: this.startAnimKey,//発射時
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 7 }),
            frameRate: this.frameRateValue,
            repeat: -1
        });
        this.anims.create({
            key: this.finishAnimKey,//終了時
            frames: this.anims.generateFrameNumbers(texture, { start: 8, end: 11 }),
            frameRate: this.frameRateValue,
            repeat: -1
        });
    }

    //特殊効果
    override async specialEffect() {
        this.soundScene.playSe('SE_fire', 0.3, true);
        return new Promise<void>(resolve => {
            const tween = this.scene.tweens.add({
                targets: this,
                scale: 2,
                ease: 'sine.inout',
                repeat: 2,
                yoyo: true,
                duration: this.attackDuration,
                onComplete: () => {
                    resolve();
                    this.soundScene.stopSe();
                    tween.destroy();
                }
            });
        })
    }

    //オーバーライド
    override async finishAnimation(): Promise<void> {
        return new Promise<void>(resolve => {

            //指定秒後に発生
            this.scene.time.delayedCall(this.attackDuration, () => {
                this.anims.play(this.finishAnimKey, true);
                resolve();
            }, undefined, this.scene);
        })
    }
}
