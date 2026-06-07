import { Scene } from 'phaser';
import { Sound } from '../../scenes/Sound';
import { BgmState } from "../../lib/types";
import { gameStateManager } from '../../core/GameStateManager';

export class Opening {
    private scene: Scene;
    private soundScene: Sound;

    constructor(scene: Scene) {
        this.scene = scene;
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public stopOpening() {
        this.soundScene.stopAllBgm();
    }

    public async playOpening(): Promise<void> {
        const debugFlg = this.scene.game.config.physics.arcade?.debug;
        if (debugFlg) return;

        //現在のBGM状態を更新
        gameStateManager.setBgmState(BgmState.TITLE);

        const gameWidth = Number(this.scene.game.config.width);
        const gameHeight = Number(this.scene.game.config.height);

        const meinaOpImage = this.scene.add.image(0, gameHeight / 2, 'meinaOpImage');
        const lamyOpImage = this.scene.add.image(gameWidth, gameHeight / 2, 'lamyOpImage');
        const meinaOpImageHome = this.scene.add.image(0, gameHeight / 2, 'meinaOpImageHome');
        const lamyOpImageHome = this.scene.add.image(gameWidth, gameHeight / 2, 'lamyOpImageHome');

        meinaOpImage.setPosition(gameWidth + meinaOpImage.width / 2, gameHeight / 2 + 100).setDepth(gameHeight);
        meinaOpImageHome.setPosition(gameWidth + meinaOpImageHome.width / 2, gameHeight / 2).setDepth(gameHeight - 10);
        lamyOpImage.setPosition(- lamyOpImage.width / 2, gameHeight / 2 + 100).setDepth(gameHeight - 5);
        lamyOpImageHome.setPosition(- lamyOpImageHome.width / 2, gameHeight / 2).setDepth(gameHeight - 20);

        return new Promise<void>(resolve => {
            const timeline = this.scene.add.timeline([
                {
                    at: 0,
                    tween: {
                        targets: lamyOpImageHome,
                        x: gameWidth - lamyOpImageHome.width / 2,
                        ease: 'Power2',
                        duration: 200
                    }
                },
                {
                    at: 200,
                    tween: {
                        targets: lamyOpImage,
                        x: gameWidth - lamyOpImage.width / 2,
                        ease: 'circ.out',
                        duration: 500
                    }
                },
                {
                    at: 1000,
                    tween: {
                        targets: meinaOpImageHome,
                        x: gameWidth - meinaOpImageHome.width / 2,
                        ease: 'Power2',
                        duration: 200
                    }
                },
                {
                    at: 1200,
                    tween: {
                        targets: meinaOpImage,
                        x: meinaOpImage.width / 2,
                        ease: 'circ.out',
                        duration: 500
                    }
                },
                {
                    at: 2000,
                    tween: {
                        targets: meinaOpImage,
                        x: - meinaOpImage.width,
                        ease: 'back.in',
                        duration: 400
                    }
                },
                {
                    at: 2200,
                    tween: {
                        targets: lamyOpImage,
                        x: gameWidth + lamyOpImage.width,
                        ease: 'back.in',
                        duration: 400
                    },
                },
            ]);

            timeline.once('complete', () => {
                resolve();
            });

            timeline.play();
        });
    }
}
