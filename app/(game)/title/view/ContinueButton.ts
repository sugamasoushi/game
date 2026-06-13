import { GameObjects } from 'phaser';
import { Title } from '../../scenes/Title';

export class ContinueButton {
    public ContinueStart: GameObjects.Text;
    private selectTween: Phaser.Tweens.Tween | null = null;
    public onContinue: () => void = () => { };

    constructor(private titleScene: Title) { }

    public createMenuButtons(hasContinueData: boolean) {
        return new Promise<void>(resolve => {

            const gameWidth = Number(this.titleScene.game.config.width);
            const gameHeight = Number(this.titleScene.game.config.height);

            this.ContinueStart = this.titleScene.add.text(
                gameWidth / 2, gameHeight / 2 + 125,
                "Continue", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
            this.ContinueStart.setOrigin(0.5, 0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
            this.ContinueStart.setDepth(gameHeight);

            if (hasContinueData) {
                this.ContinueStart.setInteractive({ useHandCursor: true });
                this.ContinueStart.on('pointerdown', () => this.onContinue());
            } else {
                this.ContinueStart.setAlpha(0.5);
                this.ContinueStart.disableInteractive();
            }
            resolve();
        });
    }

    public async playDecideEffect(): Promise<void> {
        this.titleScene.SE_syakiin.play();

        const target = this.ContinueStart;
        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }

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

        this.ContinueStart.setTint(Phaser.Display.Color.GetColor(255, 255, 255));

        this.selectTween = this.titleScene.tweens.add({
            targets: this.ContinueStart,
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
        this.ContinueStart.setScale(1);
        this.ContinueStart.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
    }

    public disableInteractive() {
        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }
        this.ContinueStart.disableInteractive();
        this.ContinueStart.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        return this;
    }
    public enableInteractive() {
        this.ContinueStart.setInteractive({ useHandCursor: true });
        this.ContinueStart.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        return this;
    }

}
