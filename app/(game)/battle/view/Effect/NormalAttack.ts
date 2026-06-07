import { EffectCommon } from "./EffectCommon";
import { Sound } from "../../../scenes/Sound";

export class NormalAttack extends EffectCommon {

    private soundScene: Sound;
    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'normalAttack');
        this.name = 'normalAttack';
        this.attackDuration = 500;
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    //アニメーション設定
    override animationSetting(texture: string) {
        this.frameRateValue = 30;
        
        this.anims.create({
            key: this.startAnimKey,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 8 }),
            frameRate: this.frameRateValue,
            repeat: -1
        });
        // this.anims.create({
        //     key: this.finishAnimKey,//終了時
        //     frames: this.anims.generateFrameNumbers(texture, { start: 8, end: 8 }),
        //     frameRate: this.frameRateValue,
        //     repeat: -1
        // });
    }
    //特殊効果
    override async specialEffect() {
        this.soundScene.playSe('SE_attack6');
        return new Promise<void>(resolve => {
            const tween = this.scene.tweens.add({
                targets: this,
                scale: 2,
                ease: 'sine.inout',
                repeat: 1,
                duration: this.attackDuration,
                onComplete: () => {
                    resolve();
                    this.soundScene.stopSe();
                    tween.destroy();
                }
            });
        })
    }
}
