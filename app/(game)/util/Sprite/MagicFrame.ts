import { BaseSprite } from "../../core/BaseSprite";

export class MagicFrame extends BaseSprite {

    constructor(scene: Phaser.Scene, x: number, y: number, attackDuration?: number, sprite?: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, 'flames32', attackDuration, sprite);
        this.name = 'MagicFrame';
        this.attackDuration = attackDuration || 250;

        //フィールドとマップで使い分ける
        if (sprite !== undefined) {
            (this.body as Phaser.Physics.Arcade.Body).onOverlap = true;
            this.bodySetting((this.body as Phaser.Physics.Arcade.Body));
        }
    }

    //フィールドアタック用
    private bodySetting(body: Phaser.Physics.Arcade.Body) {
        const newWidth = 20;
        const newHeight = 20;
        body.offset.x = (body.width - newWidth) / 2;
        body.offset.y = (body.height - newHeight) / 2;
        body.setSize(newWidth, newHeight);
    }

    //アニメーション設定
    override animationSetting(texture: string) {
        this.frameRateValue = 10;
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

    //バトル用特殊効果
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

    //バトル用終了アニメーション
    override async finishAnimation(): Promise<void> {
        return new Promise<void>(resolve => {
            this.scene.time.delayedCall(this.attackDuration, () => {
                this.anims.play(this.finishAnimKey, true);
                resolve();
            }, undefined, this.scene);
        })
    }
}
