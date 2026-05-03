import { EffectCommon } from "./EffectCommon";

export class WindCutter extends EffectCommon {

    constructor(scene: Phaser.Scene, x: number, y: number, attackDuration: number, sprite: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, 'tex_WindCutter', attackDuration, sprite);

        //フィールドとバトルで使い分ける
        if (sprite !== undefined) {
            this.name = 'WindCutter';
            (this.body as Phaser.Physics.Arcade.Body).onOverlap = true;
            this.bodySetting((this.body as Phaser.Physics.Arcade.Body));
        } else {
            this.name = 'WindCutter';
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
            key: this.startAnimKey,//発射時
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 9 }),
            frameRate: this.frameRateValue,
            repeat: -1
        });
        this.anims.create({
            key: this.finishAnimKey,//終了時
            frames: this.anims.generateFrameNumbers(texture, { start: 9, end: 9 }),
            frameRate: this.frameRateValue,
            repeat: -1
        });
    }
}
