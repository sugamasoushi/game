import { BaseSprite } from "../../core/BaseSprite";

export class WindCutter extends BaseSprite {

    constructor(scene: Phaser.Scene, x: number, y: number, attackDuration?: number, sprite?: Phaser.GameObjects.Sprite | undefined) {
        super(scene, x, y, 'tex_WindCutter', attackDuration, sprite);
        this.name = 'WindCutter';
        this.attackDuration = attackDuration || 400;

        //フィールドとバトルで使い分ける
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

    //バトル用特殊効果
    override async specialEffect() {
        this.soundScene.playSe('SE_windCutter');
        return new Promise<void>(resolve => {
            this.scene.time.delayedCall(this.attackDuration, () => {
                resolve();
            }, undefined, this.scene);
        })
    }
}
