import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";

export class FieldMessageWindow extends Phaser.GameObjects.Container {
    private messageObject: Phaser.GameObjects.Text;
    private messageWindow: Phaser.GameObjects.Graphics;
    private textX: number;//テキスト座標、吹き出しやアイコン等の基準座標
    private textY: number;

    constructor(scene: Phaser.Scene) {
        super(scene, 0, 0);
        this.name = FieldMessageWindow.name;
        this.scene.add.existing(this);
        this.addToUpdateList();
    }

    init() {
        this.createWindow();
    }

    private createWindow() {
        //項目テキスト作成
        const messageObjectInstace = new MessageObject();
        messageObjectInstace.init(this.scene);
        this.messageObject = messageObjectInstace.createTextObject(this.scene, 0, 0, ['初期値']);

        this.textX = 250;
        this.textY = Number(this.scene.game.canvas.height) - 200 + 20;

        //テキストオブジェクトの位置を更新
        this.messageObject.x = this.textX;
        this.messageObject.y = this.textY;

        //ウィンドウ作成
        const messageWindowInstance = new MessageWindow(this.scene);
        messageWindowInstance.init();
        messageWindowInstance.createEventMessageWindow(this.messageObject);
        this.messageWindow = messageWindowInstance;

        //コンテナ作成
        this.add(this.messageWindow);
        this.add(this.messageObject);

        //非表示
        this.setVisible(false);
        this.setScrollFactor(0)
        this.setDepth(9999999);
    }

    messageOutput(text: string, value: number | undefined) {
        const time = value ? value : 1000;
        this.messageObject.setText(text);

        return new Promise<void>(resolve => {
            this.setVisible(true);
            this.scene.time.delayedCall(time, () => {
                this.setVisible(false);
                resolve();
            }, [], this.scene);

        })
    }
}
