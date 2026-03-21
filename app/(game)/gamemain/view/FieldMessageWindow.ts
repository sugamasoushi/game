import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";

export class FieldMessageWindow extends Phaser.GameObjects.Container {
    private messageObject: Phaser.GameObjects.Text;
    private messageWindow: MessageWindow;

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
        const marginX = 200;
        const width = Number(this.scene.game.config.width) - marginX * 2;
        const height = 200;
        const rectR = 32;

        //項目テキスト作成
        const messageObjectInstace = new MessageObject();
        messageObjectInstace.init(this.scene);
        this.messageObject = messageObjectInstace.createTextObject(this.scene, 20, 20, ['初期値']);
        this.messageObject.setScrollFactor(0)

        //ウィンドウ作成
        this.messageWindow = new MessageWindow(this.scene);
        this.messageWindow.init();
        // createMessageWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.messageWindow.createMessageWindow(-rectR, -rectR, width, height, rectR, undefined);
        this.messageWindow.setScrollFactor(0)

        //コンテナ作成
        this.add(this.messageWindow);
        this.add(this.messageObject);

        //非表示
        this.setVisible(false);

        // 左右の余白を等しく設定
        this.x = marginX;
        this.y = Number(this.scene.game.config.height) - height - 40;
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
