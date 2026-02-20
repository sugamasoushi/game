import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";
import { BattleScene } from "../../lib/types";

export class BattleMessageWindow extends Phaser.GameObjects.Container {
    //※選択リストは必ずテキストオブジェクトを格納したcolumnを参照する事。
    //コンテナにはウィンドウオブジェクトも含まれているため、container.listを使用すると不要な番号を取得してしまう。
    private messageObject: Phaser.GameObjects.Text;
    private messageWindow: MessageWindow;

    constructor(battleScene: BattleScene) {
        super(battleScene, 0, 0);
        this.name = BattleMessageWindow.name;
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

        //ウィンドウ作成
        const width = Number(this.scene.game.config.width) - 300;
        const height = 200;
        this.messageWindow = new MessageWindow(this.scene);
        this.messageWindow.init();
        this.messageWindow.createMessageWindow(-64, -64, width, height, undefined, undefined);

        //コンテナ作成
        this.add(this.messageWindow);
        this.add(this.messageObject);

        //クリック可能に設定
        // this.enableSelect();

        //非表示
        this.setVisible(false);
        this.disableSelect();

        this.x = Number(this.scene.game.config.width) / 2 - width / 2;
        this.y = Number(this.scene.game.config.height) - 200;
        this.setDepth(1000);
    }

    //テキストクリック可
    enableSelect() {
        // this.allow.lightUp();
        // this.clickZone.setInteractive({ useHandCursor: true });//テキストをクリック可能にする
    }

    //テキストクリック不可
    disableSelect() {
        // this.allow.lightDown();
        // this.clickZone.disableInteractive();
    }

    messageOutput(text: string, value: number | undefined) {
        const time = value ? value : 1000;
        this.messageObject.setText(text);

        return new Promise<void>(resolve => {
            this.setVisible(true);
            setTimeout(() => {
                this.setVisible(false);
                resolve();
            }, time);
        })
    }
}
