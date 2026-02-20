import { GameScene } from "@/app/(game)/lib/types";
import { BaseParts } from "@/app/(game)/core/BaseParts";

export class Shadow extends BaseParts {
    frameRate = 10;

    constructor(sprite: Phaser.Physics.Arcade.Sprite, gameScene: GameScene, x: number, y: number, texture: string, direction: string) {
        super(sprite, gameScene, x, y, texture, direction);
        this._animationSetting(texture);
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.sprite.depth - 1);
    }

    _animationSetting(texture: string) {
        this.anims.create({
            key: this.walkLeft,
            frames: this.anims.generateFrameNumbers(texture, { start: 1, end: 1 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.walkRight,
            frames: this.anims.generateFrameNumbers(texture, { start: 2, end: 2 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.walkUp,
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 0 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.walkDown,
            frames: this.anims.generateFrameNumbers(texture, { start: 3, end: 3 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.standLeft,
            frames: this.anims.generateFrameNumbers(texture, { start: 1, end: 1 }),
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
            frames: this.anims.generateFrameNumbers(texture, { start: 0, end: 0 }),
            frameRate: this.frameRate,
            repeat: -1
        });
        this.anims.create({
            key: this.standDown,
            frames: this.anims.generateFrameNumbers(texture, { start: 3, end: 3 }),
            frameRate: this.frameRate,
            repeat: -1
        });
    }

}
