import { EffectCommon } from "./EffectCommon";
import { Sound } from "../../../scenes/Sound";

export class WindCutter extends EffectCommon {
    private soundScene: Sound;

    constructor(scene: Phaser.Scene, x: number, y: number) {
        super(scene, x, y, 'tex_WindCutter');
        this.name = 'WindCutter';
        this.attackDuration = 400;
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    //アニメーション設定
    override animationSetting(texture: string) {
        this.frameRateValue = 30

        this.anims.create({
            key: this.startAnimKey,//発射時
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 9 }),
            frameRate: this.frameRateValue,
            repeat: -1
        });
        // this.anims.create({
        //     key: this.finishAnimKey,//終了時
        //     frames: this.anims.generateFrameNumbers(texture, { start: 9, end: 9 }),
        //     frameRate: this.frameRateValue,
        //     repeat: -1
        // });
    }

    //特殊効果
    override async specialEffect() {
        this.soundScene.SE_windCutter.play();

        return new Promise<void>(resolve => {
            this.scene.time.delayedCall(this.attackDuration, () => {
                this.soundScene.SE_windCutter.stop();
                resolve();
            }, undefined, this.scene);

            // const tween = this.scene.tweens.add({
            //     targets: this,
            //     scale: 3,
            //     alpha: 0,
            //     // ease: 'sine.inout',
            //     duration: this.attackDuration,
            //     onComplete: () => {
            //         resolve();
            //         this.soundScene.SE_windCutter.stop();
            //         tween.destroy();
            //     }
            // });
        })
    }
}
