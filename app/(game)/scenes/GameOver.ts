import { EventBus } from '../EventBus';
import { Scene } from 'phaser';

export class GameOver extends Scene {
    camera: Phaser.Cameras.Scene2D.Camera;
    background: Phaser.GameObjects.Image;
    gameOverText: Phaser.GameObjects.Text;

    constructor() {
        super('GameOver');
    }

    create() {
        // this.camera = this.cameras.main
        // this.camera.setBackgroundColor(0xff0000);

        // this.background = this.add.image(512, 384, 'background');
        // this.background.setAlpha(0.5);

        // this.gameOverText = this.add.text(512, 384, 'Game Over', {
        //     fontFamily: 'Arial Black', fontSize: 64, color: '#ffffff',
        //     stroke: '#000000', strokeThickness: 8,
        //     align: 'center'
        // }).setOrigin(0.5).setDepth(100);

        EventBus.emit('current-scene-ready', this);

        this.cameras.main.fadeIn(1000);

        //タイトルテキスト
        const titleText = this.add.text(
            Number(this.game.config.width) / 2, Number(this.game.config.height) / 2 - 200,
            "GameOver", { fontFamily: "Arial Black", fontSize: 128, color: "#00a6ed" });
        titleText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);

        this.scene.stop('Battle');
        this.scene.stop('Game');


        setTimeout(() => {
            this.backTitleScene();
        }, 2000);
    }

    backTitleScene() {
        const pixelated = this.cameras.main.postFX.addPixelate(-1);
        this.add.tween({
            targets: pixelated,
            duration: 700,
            amount: 40,
            onComplete: () => {
                this.cameras.main.fadeOut(100);
                this.scene.moveAbove('GameOver', 'Title');
                this.scene.start('Title');

                this.game.events.emit('BGM_ALL_STOP');
            }
        });
    }

    changeScene() {
        this.scene.start('MainMenu');
    }
}
