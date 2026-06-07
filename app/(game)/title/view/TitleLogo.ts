import { Title } from '../../scenes/Title';
import { TitleModel } from '../model/TitleModel';
import { GameObjects } from 'phaser';
import { MessageWindow } from '../../util/MessageWindow';
import { MessageObject } from '../../util/MessageObject';
import { GameStateManager } from '../../core/GameStateManager';

export class TitleLogo {

    public titleText: GameObjects.Text;
    public newGameStart: GameObjects.Text;
    public ContinueStart: GameObjects.Text;
    public OptionStart: GameObjects.Text;

    private selectTween: Phaser.Tweens.Tween | null = null;

    private optionGroup: Phaser.GameObjects.Group | null = null;
    private volumeBarText: Phaser.GameObjects.Text | null = null;
    private volumeLeftText: Phaser.GameObjects.Text | null = null;
    private volumeRightText: Phaser.GameObjects.Text | null = null;

    private pendingMasterVolume: number = 100;
    private lastSentMasterVolume: number = -1;

    // Callbacks to Presenter
    public onNewGame: () => void = () => { };
    public onContinue: () => void = () => { };
    public onOption: () => void = () => { };
    public onVolumeClick: (volume: number) => void = () => { };

    constructor(private titleScene: Title, private titleModel: TitleModel) { }

    public update(time: number, delta: number): void {
        // const titleScene = this.titleScene;
        if (this.titleModel.isOptionActive || (this.optionGroup && this.optionGroup.active)) {
            if (this.pendingMasterVolume !== this.lastSentMasterVolume) {
                this.lastSentMasterVolume = this.pendingMasterVolume;
                const manager = GameStateManager.getInstance();
                const current = manager.currentOptionData;
                manager.setOptionData(
                    this.pendingMasterVolume,
                    current.bgmVolume,
                    current.bgsVolume,
                    current.seVolume,
                    current.textSpeed
                );
            }
        }
    }

    public async showTitleText(): Promise<void> {
        const gameWidth = Number(this.titleScene.game.config.width);
        const gameHeight = Number(this.titleScene.game.config.height);

        //タイトルテキスト
        this.titleText = this.titleScene.add.text(
            gameWidth / 2, gameHeight / 2 - 200,
            "ちょっとだけRPG", { fontFamily: "Arial Black", fontSize: 128, color: "#00a6ed" });
        this.titleText.setDepth(gameHeight);
        this.titleText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true).setAlpha(0);

        await new Promise<void>(resolve => {
            this.titleScene.tweens.add({
                targets: this.titleText,
                alpha: 1,
                duration: 1000,
                ease: 'Power1',
                onComplete: () => {
                    resolve();
                }
            });
        });

        this.titleScene.tweens.addCounter({
            from: 0,
            to: 100,
            duration: 1000,
            repeat: -1,
            yoyo: true,
            onUpdate: (tween) => {
                const value = tween.getValue();
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    Phaser.Display.Color.HexStringToColor('#00a6ed'),
                    Phaser.Display.Color.HexStringToColor('#ffffff'),
                    100,
                    value!
                );
                this.titleText.setTint(Phaser.Display.Color.GetColor(color.r, color.g, color.b));
            }
        });

        const emitter = this.titleScene.add.particles(0, 0, 'spark', {
            scale: 0.5,
            lifespan: 10000,
            gravityY: -50,
            frequency: 20,
            maxVelocityX: 200,
            maxVelocityY: 200,
            blendMode: 'ADD'
        });

        const shape1 = new Phaser.Geom.Rectangle(0, 600, gameWidth, 128);
        emitter.addEmitZone({
            type: 'random',
            source: shape1
        } as Phaser.Types.GameObjects.Particles.EmitZoneData);

        emitter.createGravityWell({
            x: gameWidth / 2,
            y: 150,
            power: 4.2,
            epsilon: 250,
            gravity: 100
        });

        emitter.setDepth(gameHeight - 5);
    }

    public createMenuButtons(hasContinueData: boolean) {
        const gameWidth = Number(this.titleScene.game.config.width);
        const gameHeight = Number(this.titleScene.game.config.height);

        // New Game
        this.newGameStart = this.titleScene.add.text(
            gameWidth / 2, gameHeight / 2 + 25,
            "New Game", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.newGameStart.setOrigin(0.5, 0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.newGameStart.setDepth(gameHeight);
        this.newGameStart.setInteractive({ useHandCursor: true });
        this.newGameStart.on('pointerdown', () => this.onNewGame());

        // Continue
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

        // Option
        this.OptionStart = this.titleScene.add.text(
            gameWidth / 2, gameHeight / 2 + 250,
            "おぷしょん", { fontFamily: "Arial Black", fontSize: 50, color: "#00a6ed" });
        this.OptionStart.setOrigin(0.5, 0.5).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.OptionStart.setDepth(gameHeight);
        this.OptionStart.setInteractive({ useHandCursor: true });
        this.OptionStart.on('pointerdown', () => this.onOption());
    }

    public disableInteractiveAll() {
        this.newGameStart.disableInteractive();
        if (this.ContinueStart) this.ContinueStart.disableInteractive();
        this.OptionStart.disableInteractive();
    }

    public enableInteractiveAll(hasContinueData: boolean) {
        this.newGameStart.setInteractive({ useHandCursor: true });
        if (this.ContinueStart && hasContinueData) {
            this.ContinueStart.setInteractive({ useHandCursor: true });
        }
        this.OptionStart.setInteractive({ useHandCursor: true });
    }

    public updateSelection(menuItems: GameObjects.Text[], nowSelectNo: number, hasContinueData: boolean) {
        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }

        this.newGameStart.setScale(1).setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        if (this.ContinueStart) {
            this.ContinueStart.setScale(1).setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            if (!hasContinueData) {
                this.ContinueStart.setAlpha(0.5);
            }
        }
        if (this.OptionStart) {
            this.OptionStart.setScale(1).setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        }

        const target = menuItems[nowSelectNo];
        if (target) {
            target.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
            this.selectTween = this.titleScene.tweens.add({
                targets: target,
                scale: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    public async playDecideEffect(target: GameObjects.Text, se: Phaser.Sound.HTML5AudioSound): Promise<void> {
        se.play();
        if (this.selectTween) {
            this.selectTween.stop();
            this.selectTween = null;
        }

        const other = (target === this.newGameStart) ? this.ContinueStart : this.newGameStart;
        if (other) {
            this.titleScene.tweens.add({
                targets: other,
                alpha: 0,
                duration: 200
            });
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

    public setPendingMasterVolume(volume: number) {
        this.pendingMasterVolume = Phaser.Math.Clamp(volume, 0, 100);
        this.updateVolumeBarDisplay(this.pendingMasterVolume);
    }

    public getPendingMasterVolume(): number {
        return this.pendingMasterVolume;
    }

    public showOptionMenu(masterVolume: number) {
        this.pendingMasterVolume = masterVolume;
        this.lastSentMasterVolume = masterVolume;

        const height = Number(this.titleScene.game.config.height);
        const textX = 300;
        const textY = 300;

        const messageObject = new MessageObject();
        messageObject.init(this.titleScene, 'Title');

        const text1 = messageObject.createTextObject(this.titleScene, textX, textY + 125, ["マスタ音量"]);
        const text2 = messageObject.createTextObject(this.titleScene, textX, textY + 175, ["BGM音量"]);
        const text3 = messageObject.createTextObject(this.titleScene, textX, textY + 225, ["環境音量"]);
        const text4 = messageObject.createTextObject(this.titleScene, textX, textY + 275, ["効果音量"]);

        text1.setDepth(height + 10000);
        text2.setDepth(height + 10000);
        text3.setDepth(height + 10000);
        text4.setDepth(height + 10000);

        const messageWindow = new MessageWindow(this.titleScene);
        messageWindow.init();
        messageWindow.createEventMessageWindow(text1);

        // Create left, bar, and right text objects for volume display
        this.volumeLeftText = messageObject.createTextObject(this.titleScene, textX + 250, textY + 125, ["0"]);
        this.volumeLeftText.setDepth(height + 10000);
        this.volumeBarText = messageObject.createTextObject(this.titleScene, textX + 280, textY + 125, [""]);
        this.volumeBarText.setDepth(height + 10000);
        this.volumeRightText = messageObject.createTextObject(this.titleScene, textX + 650, textY + 125, ["100"]);
        this.volumeRightText.setDepth(height + 10000);

        // Group all option elements including the new volume texts
        this.optionGroup = this.titleScene.add.group([text1, text2, text3, text4, messageWindow, this.volumeLeftText, this.volumeBarText, this.volumeRightText]);

        // Initialize display
        this.updateVolumeBarDisplay(masterVolume);

        // Interaction only on the bar part
        this.volumeBarText.setInteractive({ useHandCursor: true });
        this.volumeBarText.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            const localX = pointer.x - (this.volumeBarText!.x - this.volumeBarText!.width * this.volumeBarText!.originX);
            const percentage = Phaser.Math.Clamp(localX / this.volumeBarText!.width, 0, 1);
            const step = Math.round(percentage * 10);
            this.setPendingMasterVolume(step * 10);
        });
    }

    public updateVolumeBarDisplay(masterVolume: number) {
        if (!this.volumeBarText) return;
        const step = Math.round(masterVolume / 10); // 0〜100 を 0〜10 に

        let barStr = "";
        for (let i = 0; i <= 10; i++) {
            if (i === step) {
                barStr += "●";
            } else {
                barStr += "━";
            }
        }
        // Update individual text objects
        if (this.volumeLeftText) this.volumeLeftText.setText("0");
        if (this.volumeBarText) this.volumeBarText.setText(barStr);
        if (this.volumeRightText) this.volumeRightText.setText(`${Math.round(masterVolume)}`);
    }

    public hideOptionMenu() {
        if (this.optionGroup) {
            this.optionGroup.destroy(true);
            this.optionGroup = null;
        }
        this.volumeBarText = null;
    }
}
