import { GameScene } from "../lib/types";
import { BaseSprite } from "./BaseSprite";

export class BaseParts extends BaseSprite {
    protected sprite: Phaser.Physics.Arcade.Sprite;//親スプライトへの参照

    constructor(sprite: Phaser.Physics.Arcade.Sprite, gameScene: GameScene, x: number, y: number, texture: string, direction: string) {
        super(gameScene, x, y, texture, direction);
        this.sprite = sprite;
        this.name = this.sprite.name + "-" + texture;
        this.scene.physics.add.existing(this);//物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
        (this.body as Phaser.Physics.Arcade.Body).setImmovable(false);//Body の不動プロパティを設定、物理演算されなくなる。
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.followMoveSprite();
        this.delete();
    }

    protected followMoveSprite() {
        this.x = this.sprite.x;
        this.y = this.sprite.y;
    }

    private delete() {
        if (this.sprite.getData('HP') <= 0) {
            this.destroy();
        }
    }
}
