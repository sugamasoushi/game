import { GameObjects } from 'phaser';
import { Title } from '../../scenes/Title';

export class OptionButton {
    public OptionStart: GameObjects.Text;
    private selectTween: Phaser.Tweens.Tween | null = null;
    public onOption: () => void = () => { };

    constructor(private titleScene: Title) { }

    public createMenuButtons() {
        return new Promise<void>(resolve => {
            const gameWidth = Number(this.titleScene.game.config.width);
            const gameHeight = Number(this.titleScene.game.config.height);

            this.OptionStart = this.titleScene.add.text(
                gameWidth / 2, gameHeight / 2 + 250,
                "おぷしょん", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
            this.OptionStart.setOrigin(0.5, 0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
            this.OptionStart.setDepth(gameHeight);
            this.OptionStart.setInteractive({ useHandCursor: true });
            this.OptionStart.on('pointerdown', () => this.onOption());

            resolve();
        });
    }

    public async playDecideEffect(target: GameObjects.Text): Promise<void> {
        this.titleScene.SE_syakiin.play();

        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }

        // if (target) {
        //     this.titleScene.tweens.add({
        //         targets: target,
        //         alpha: 0,
        //         duration: 200
        //     });
        // }

        return new Promise(resolve => {
            this.titleScene.tweens.add({
                targets: target,
                scale: 1.3,
                duration: 100,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    resolve();
                }
            });

            this.titleScene.tweens.addCounter({
                from: 0,
                to: 100,
                duration: 100,
                repeat: 3,
                yoyo: true,
                onUpdate: (tween) => {
                    const value = tween.getValue();
                    const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                        Phaser.Display.Color.HexStringToColor('#ffffff'),
                        Phaser.Display.Color.HexStringToColor('#00a6ed'),
                        100,
                        value!
                    );
                    target.setColor('#ffffff');
                    target.setShadow(4, 4, '#00a6ed', 8, false, true);
                    target.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
                }
            });
        });
    }

    public selection() {

        this.OptionStart.setTint(Phaser.Display.Color.GetColor(255, 255, 255));

        this.selectTween = this.titleScene.tweens.add({
            targets: this.OptionStart,
            scale: 1.1,
            duration: 500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    public noSelect() {
        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }
        this.OptionStart.setScale(1);
        this.OptionStart.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
    }

    public disableInteractive() {
        this.OptionStart.disableInteractive();
        this.OptionStart.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        return this;
    }
    public enableInteractive() {
        this.OptionStart.setInteractive({ useHandCursor: true });
        this.OptionStart.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        return this;
    }

}
