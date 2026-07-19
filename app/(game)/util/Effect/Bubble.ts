import { CharacterState } from "../../lib/FieldTypes";
import { GameStateManager } from "../../core/GameStateManager";

export class Bubble extends Phaser.GameObjects.Sprite {
    private sprite: Phaser.GameObjects.Sprite;
    private spriteSheetKey :string;
    private animationKey :string;

    constructor(scene: Phaser.Scene, sprite: Phaser.GameObjects.Sprite) {
        super(scene, sprite.x, sprite.y - 32, 'tex_bubble');
        this.name = sprite.name + '_Bubble';
        this.sprite = sprite;
        this.spriteSheetKey = 'tex_bubble';
        this.animationKey = 'bubbleAnimation'
        this.addToDisplayList();
    }

    public execute() {
        this.animationSetting();
        this.anims.play(this.animationKey);

        this.scene.events.on('shutdown', () => {
            this.destroy();
        });
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.sprite.depth);
        this.display();

        this.x = this.sprite.x;
        this.y = this.sprite.y - 32;
    }

    //アニメーション設定
    private animationSetting() {
        this.anims.create({
            key: this.animationKey,
            frames: this.anims.generateFrameNumbers(this.spriteSheetKey, { start: 0, end: 2 }),
            frameRate: 5,
            repeat: -1
        });
    }

    private display() {
        if (this.sprite.state !== CharacterState.normal) return;

        const gameStateManager = GameStateManager.getInstance();
        const player = gameStateManager.currentPlayerPartyList[0];

        //プレイヤーが近ければ表示する
        if (Phaser.Math.Difference(this.sprite.x, player.x) < 100 && Phaser.Math.Difference(this.sprite.y, player.y) < 100) {
            this.setVisible(true);
        } else {
            this.setVisible(false);
        }
    }
}
