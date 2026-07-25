import { CharacterState } from "../../lib/FieldTypes";
import { GameStateManager } from "../../core/GameStateManager";

export class Bubble extends Phaser.GameObjects.Sprite {
    private spriteSheetKey: string;
    private animationKey: string;

    constructor(scene: Phaser.Scene, private sprite: Phaser.GameObjects.Sprite) {
        super(scene, sprite.x, sprite.y - 32, 'tex_bubble');
        this.name = sprite.name + '_Bubble';
        this.spriteSheetKey = 'tex_bubble';
        this.animationKey = 'bubbleAnimation'
        this.addToDisplayList();
    }

    public execute() {
        this.animationSetting();
        this.anims.play(this.animationKey);

        //削除処理の登録
        this.scene.events.once('shutdown', () => { this.destroy(); });
        this.sprite.once(Phaser.GameObjects.Events.DESTROY, () => { this.destroy(); })
    }

    //移動
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

        //親スプライトの状態がノーマル以外の場合は非表示
        if (this.sprite.state === CharacterState.event) {
            this.setVisible(false);
            return
        };

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
