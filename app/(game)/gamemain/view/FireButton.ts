import { GameScene } from "../../lib/types";
import { MapObject } from "./MapObject";
import { FieldAttack } from "./character/Action/FieldAttack";

export class FireButton {
    private fieldAttack: FieldAttack;

    constructor(
        private gameScene: GameScene,
        private mapObject: MapObject) {
    }

    public async execute() {
        this.createFireButton();
    }

    //テスト用のボタン
    private createFireButton() {

        const gameConfigWidth: number = Number(this.gameScene.game.config.width);
        const gameConfigHeight: number = Number(this.gameScene.game.config.height);


        const flameX = 100;
        const flameY = gameConfigHeight - 50;
        const flameDepth = 999999;
        this.fieldAttack = new FieldAttack(this.mapObject.getPlayer(), this.mapObject.getPlayer().x, this.mapObject.getPlayer().y);

        const flame = this.gameScene.add.particles(flameX, flameY, 'flares', {
            frame: 'white',
            color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404],
            colorEase: 'quad.out',
            lifespan: 1400,
            angle: { min: -100, max: -80 },
            scale: { start: 0.50, end: 0, ease: 'sine.out' },
            speed: 100,
            advance: 1000,
            blendMode: 'ADD'
        });

        flame.setScrollFactor(0);
        flame.setDepth(flameDepth);

        const tapText = this.gameScene.add.text(
            flameX, flameY,
            "FIRE!", { fontFamily: "Arial Black", fontSize: 24, color: "#df5757ff" });
        tapText.setOrigin(0.5, 0.5).setStroke('#582a2aff', 12).setShadow(4, 4, '#582a2aff', 8, false, true);
        tapText.setDepth(flame.depth + 1);
        tapText.setScrollFactor(0);
        tapText.setAlpha(0);

        const hitZone = this.gameScene.add.zone(flameX, flameY, 100, 100)
            .setInteractive({ useHandCursor: true })
            .setScrollFactor(0)
            .setDepth(tapText.depth + 1);

        hitZone.on(Phaser.Input.Events.POINTER_UP, (
            pointer: Phaser.Input.Pointer) => {

            //右クリック判定。クリック後、ボタンを離した後の判定となる。rightButtonDown()は押下中の判定となる。
            if (pointer.rightButtonReleased()) return;
            pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
            this.fieldAttack.frameBullet(this.mapObject.getPlayer().x, this.mapObject.getPlayer().y);

        })

    }

}