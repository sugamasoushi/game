import { DataDefinition } from '../Data/DataDefinition';

export class SelectAllow extends Phaser.GameObjects.Graphics {
    private allowTween: Phaser.Tweens.Tween;
    private settingData: DataDefinition;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene.add.existing(this)
        //this.addToUpdateList();
        // this.name = container.name + '_SelectAllow';
    }

    public init(x: number, y: number): void {
        this.x = x;
        this.y = y;
        this.settingData = new DataDefinition();
        // settingData.getTextInfomation()
    }

    //preUpdate(time, delta) {    }

    //カーソル作成
    public createAllow() {

        const fontSize = this.settingData.getTextInfomation(this.scene).fontSize;
        const lineColorString = this.settingData.getMessageWindowInfomation(this.scene).lineColor;
        const lineColor = Phaser.Display.Color.HexStringToColor(lineColorString).color;
        const alphaValue = this.settingData.getMessageWindowInfomation(this.scene).alphaValue;

        const pointX = 0;
        const pointY = 0 + fontSize / 2;

        this.fillStyle(lineColor, 1).setAlpha(alphaValue);
        this.fillTriangle(pointX, pointY, pointX - fontSize / 2, pointY - fontSize / 2, pointX - fontSize / 2, pointY + fontSize / 2);
        // this.setDepth(this.depthValue + 1);

        this.allowTween = this.scene.add.tween({
            targets: this,
            x: this.x + 3,
            ease: 'sine.inout',
            duration: 500,
            repeat: -1,
            yoyo: true,
            // onPause: () => {
            //     備忘：停止時の処理の実装
            // }
        });
    }

    //テキストオブジェクトへのマウスオーバーによる選択肢位置の更新
    updatePosition(textObject: Phaser.GameObjects.Text) {
        this.setVisible(true);

        //コンテナに格納されている場合はコンテナ座標位置を補正する
        // if (object.parentContainer) {
        //     this.x = object.x + object.parentContainer.x - 5;
        //     this.y = object.y + object.parentContainer.y;
        // } else {
        //     this.x = object.x - 5;
        //     this.y = object.y;
        // }

        this.x = textObject.x - 5;
        this.y = textObject.y;

        //tweenを再作成
        if (this.allowTween) {
            this.allowTween.destroy();
        }
        this.allowTween = this.scene.add.tween({
            targets: this,
            x: this.x + 3,
            ease: 'sine.inout',
            duration: 500,
            repeat: -1,
            yoyo: true
        });
    }

    lightUp() {
        this.clear();
        this.allowTween.destroy();
        this.createAllow();
    }

    lightDown() {
        this.clear();
        this.allowTween.pause();


        const fontSize = this.settingData.getTextInfomation(this.scene).fontSize;
        const lineColorString = this.settingData.getMessageWindowInfomation(this.scene).lineColor;
        const lineColor = Phaser.Display.Color.HexStringToColor(lineColorString).color;
        const alphaValue = this.settingData.getMessageWindowInfomation(this.scene).alphaValue;

        const pointX = 0;
        const pointY = 0 + fontSize / 2;
        this.fillStyle(lineColor, 1).setAlpha(alphaValue);
        this.fillTriangle(pointX, pointY, pointX - fontSize / 2, pointY - fontSize / 2, pointX - fontSize / 2, pointY + fontSize / 2);
        // this.setDepth(this.depthValue + 1);
    }
}
