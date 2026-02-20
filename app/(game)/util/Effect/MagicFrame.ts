import EffectCommon from "./EffectCommon";

export class MagicFrame extends EffectCommon {
    // private sprite: Phaser.GameObjects.Sprite;
    // private time = 0;

    constructor(scene: Phaser.Scene, x: number, y: number, attackDuration: number, sprite: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, 'flames32', attackDuration, sprite);

        //シーンとマップで使い分ける
        if (sprite !== undefined) {
            // this.sprite = sprite;
            this.name = 'MagicFrame';
            (this.body as Phaser.Physics.Arcade.Body).onOverlap = true;
            this.bodySetting((this.body as Phaser.Physics.Arcade.Body));
        } else {
            this.name = 'MagicFrame';
        }
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
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
            key: this.fireAnimKey,//発射時
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
}
