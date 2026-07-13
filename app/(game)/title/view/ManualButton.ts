import { GameObjects } from 'phaser';
import { Title } from '../../scenes/Title';
import { Manual } from './Manual';

export class ManualButton {
    public manualIcon: GameObjects.Image;
    private selectTween: Phaser.Tweens.Tween | null = null;
    public onOmake: () => void = () => { };

    constructor(private titleScene: Title) { }

    public createManualButtons() {
        const height = Number(this.titleScene.game.config.height);
        const depth = height + 10000;

        return new Promise<void>(resolve => {

            //マニュアルアイコン
            this.manualIcon = this.titleScene.add.image(1000, 500, 'manualIcon')
            this.manualIcon.setInteractive({ useHandCursor: true })
            this.manualIcon.setDepth(depth);
            this.manualIcon.on('pointerdown', () => {
                this.titleScene.input.setDefaultCursor('default');//ポインターをデフォルトに設定
                const manual = new Manual(this.titleScene);
                this.disableInteractive();
                manual.onManual(() => this.enableInteractive());
            });

            //左右に揺らす
            this.titleScene.tweens.add({
                targets: this.manualIcon,
                angle: 5,
                duration: 500,
                yoyo: true,
                repeat: -1,
            });
            resolve();
        });
    }

    public disableInteractive() {
        // if (this.selectTween) {
        //     this.selectTween.stop();
        //     this.selectTween = null;
        // }
        this.manualIcon.disableInteractive();
        this.manualIcon.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        return this;
    }

    public enableInteractive() {
        this.manualIcon.setInteractive({ useHandCursor: true });
        this.manualIcon.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        return this;
    }
}
