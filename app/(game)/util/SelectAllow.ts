import { DataDefinition } from '../Data/DataDefinition';

export class SelectAllow extends Phaser.GameObjects.Graphics {
    private allowTween: Phaser.Tweens.Tween;
    private settingData: DataDefinition;
    private direction: 'up' | 'down' | 'left' | 'right' = 'right';
    private blackEedge?:boolean

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene.add.existing(this)
        //this.addToUpdateList();
        // this.name = container.name + '_SelectAllow';
    }

    public init(x: number, y: number, direction: 'up' | 'down' | 'left' | 'right' = 'right', blackEedge?: boolean): void {
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.settingData = new DataDefinition();
        this.blackEedge = blackEedge;
        // settingData.getTextInfomation()
    }

    //preUpdate(time, delta) {    }

    //カーソル作成
    public createAllow() {

        const fontSize = 24;
        //const fontSize = this.settingData.getEventMessageInfomation(this.scene).fontSize;
        const lineColorString = this.settingData.getMessageWindowInfomation(this.scene).lineColor;
        const lineColor = Phaser.Display.Color.HexStringToColor(lineColorString).color;
        const alphaValue = this.settingData.getMessageWindowInfomation(this.scene).alphaValue;

        this.drawTriangle(fontSize, lineColor, alphaValue);
        // this.setDepth(this.depthValue + 1);

        const tweenConfig: Phaser.Types.Tweens.TweenBuilderConfig = {
            targets: this,
            ease: 'sine.inout',
            duration: 500,
            repeat: -1,
            yoyo: true
        };

        if (this.direction === 'up' || this.direction === 'down') {
            tweenConfig.y = this.y + (this.direction === 'up' ? -3 : 3);
        } else {
            tweenConfig.x = this.x + (this.direction === 'left' ? -3 : 3);
        }

        this.allowTween = this.scene.add.tween(tweenConfig);
    }

    private drawTriangle(fontSize: number, lineColor: number, alphaValue: number) {
        this.clear();
        this.setAlpha(alphaValue);

        const fs2 = fontSize / 2;
        const drawTriangle = (x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) => {
            if (this.blackEedge) {
                this.lineStyle(2, 0x000000, 1);
                this.strokeTriangle(x1, y1, x2, y2, x3, y3);
            }
            this.fillStyle(lineColor, 1);
            this.fillTriangle(x1, y1, x2, y2, x3, y3);
        };

        switch (this.direction) {
            case 'up':
                drawTriangle(0, 0, -fs2, fs2, fs2, fs2);
                break;
            case 'down':
                drawTriangle(0, fs2, -fs2, 0, fs2, 0);
                break;
            case 'left':
                drawTriangle(0, fs2, fs2, 0, fs2, fontSize);
                break;
            case 'right':
            default:
                drawTriangle(0, fs2, -fs2, 0, -fs2, fontSize);
                break;
        }
    }

    //テキストオブジェクトへのマウスオーバーによる選択肢位置の更新
    updatePosition(textObject: Phaser.GameObjects.Text) {
        this.setVisible(true);

        this.x = textObject.x - 5;
        this.y = textObject.y;

        //tweenを再作成
        if (this.allowTween) {
            this.allowTween.destroy();
        }
        this.createAllow();
    }

    lightUp() {
        if (this.allowTween) this.allowTween.destroy();
        this.createAllow();
    }

    lightDown() {
        this.clear();
        if (this.allowTween) this.allowTween.pause();

        const fontSize = this.settingData.getEventMessageInfomation(this.scene).fontSize;
        const lineColorString = this.settingData.getMessageWindowInfomation(this.scene).lineColor;
        const lineColor = Phaser.Display.Color.HexStringToColor(lineColorString).color;
        const alphaValue = this.settingData.getMessageWindowInfomation(this.scene).alphaValue;

        this.drawTriangle(fontSize, lineColor, alphaValue);
    }
}
