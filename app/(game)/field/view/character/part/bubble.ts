import { FieldScene } from "@/app/(game)/lib/types";
import { BaseParts } from "@/app/(game)/core/BaseParts";
import { CharacterState } from "@/app/(game)/lib/FieldTypes";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";
import { Player } from "../Player";

export class bubble extends BaseParts {
    private frameRate: number = 5;

    constructor(sprite: Phaser.Physics.Arcade.Sprite, fieldScene: FieldScene, x: number, y: number, texture: string, direction: string) {
        super(sprite, fieldScene, x, y, texture, direction);
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
        if (this.sprite.state !== CharacterState.normal) return;

        const gameStateManager = GameStateManager.getInstance();
        const player = gameStateManager.currentPlayerPartyList[0] as Player;

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
