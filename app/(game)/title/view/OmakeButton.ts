import { GameObjects } from 'phaser';
import { Title } from '../../scenes/Title';

export class OmakeButton {
    public OmakeButton: GameObjects.Text;
    private selectTween: Phaser.Tweens.Tween | null = null;
    public onOmake: () => void = () => { };

    constructor(private titleScene: Title) { }

    public createOmakeButtons() {
        return new Promise<void>(resolve => {
            const gameWidth = Number(this.titleScene.game.config.width);
            const gameHeight = Number(this.titleScene.game.config.height);

            this.OmakeButton = this.titleScene.add.text(
                gameWidth / 2, gameHeight / 2 + 320,
                "おまけ", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
            this.OmakeButton.setOrigin(0.5, 0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
            this.OmakeButton.setDepth(gameHeight);
            this.OmakeButton.setInteractive({ useHandCursor: true });
            this.OmakeButton.on('pointerdown', () => this.onOmake());

            resolve();
        });
    }

    public async playDecideEffect(target: GameObjects.Text): Promise<void> {
        this.titleScene.SE_syakiin.play();

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

        this.OmakeButton.setTint(Phaser.Display.Color.GetColor(255, 255, 255));

        this.selectTween = this.titleScene.tweens.add({
            targets: this.OmakeButton,
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
        this.OmakeButton.setScale(1);
        this.OmakeButton.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
    }

    public disableInteractive() {
        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }
        this.OmakeButton.disableInteractive();
        this.OmakeButton.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        return this;
    }

    public enableInteractive() {
        this.OmakeButton.setInteractive({ useHandCursor: true });
        this.OmakeButton.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        return this;
    }

    public omakeVisible() {
        this.OmakeButton.disableInteractive();
        this.OmakeButton.setVisible(false);

    }

}
