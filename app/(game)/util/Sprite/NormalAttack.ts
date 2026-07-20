import { BaseSprite } from "../../core/BaseSprite";

export class NormalAttack extends BaseSprite {

    constructor(scene: Phaser.Scene, x: number, y: number, attackDuration?: number, sprite?: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, 'normalAttack', attackDuration, sprite);
        this.name = 'normalAttack';
        this.attackDuration = attackDuration || 500;

        //シーンとマップで使い分ける
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
        this.frameRateValue = 30;
        this.anims.create({
            key: this.startAnimKey,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 8 }),
            frameRate: this.frameRateValue,
            repeat: -1
        });
    }

    //バトル用特殊効果
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
