import { EffectCommon } from "./EffectCommon";

export class NormalAttack extends EffectCommon {

    constructor(scene: Phaser.Scene, x: number, y: number, attackDuration: number, sprite: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, 'normalAttack', attackDuration, sprite);

        //シーンとマップで使い分ける
        if (sprite !== undefined) {
            this.name = 'normalAttack';
            (this.body as Phaser.Physics.Arcade.Body).onOverlap = true;
            this.bodySetting((this.body as Phaser.Physics.Arcade.Body));
        } else {
            this.name = 'normalAttack';
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
        this.anims.create({
            key: this.startAnimKey,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 8 }),
            frameRate: 30,
            repeat: -1
        });
    }
}
