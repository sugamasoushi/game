import { GameScene } from "@/app/(game)/lib/types";
import { BaseParts } from "@/app/(game)/core/BaseParts";

export class bubble extends BaseParts {
    private frameRate: number = 5;

    constructor(sprite: Phaser.Physics.Arcade.Sprite, gameScene: GameScene, x: number, y: number, texture: string, direction: string) {
        super(sprite, gameScene, x, y, texture, direction);
        this.animationSetting(texture);
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.sprite.depth + 1);
        this.display();
    }

    private animationSetting(texture: string) {
        this.anims.create({
            key: this.walkLeft,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.walkRight,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.walkUp,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.walkDown,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.standLeft,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.standRight,
            frames: this.anims.generateFrameNumbers(texture, { start: 2, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.standUp,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.standDown,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
    }

    private display() {
        const player: Phaser.Physics.Arcade.Sprite = (this.scene as GameScene).getPlayer();
        //プレイヤーが近ければ表示する
        if (Phaser.Math.Difference(this.sprite.x, player.x) < 100 && Phaser.Math.Difference(this.sprite.y, player.y) < 100) {
            this.setVisible(true);
        } else {
            this.setVisible(false);
        }
    }

    //オーバーライド
    protected followMoveSprite() {

        this.x = this.sprite.x;
        this.y = this.sprite.y - this.height;
    }
}
