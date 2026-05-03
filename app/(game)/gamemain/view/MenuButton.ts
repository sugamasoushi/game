import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";

export class MenuButton {

    constructor(private gameScene: Phaser.Scene) { }

    public async execute() {
        this.createMenuButton();
    }

    private createMenuButton() {
        const gameConfigWidth: number = Number(this.gameScene.game.canvas.width);
        const gameConfigHeight: number = Number(this.gameScene.game.canvas.height);

        // const MenuText = this.gameScene.add.text(gameConfigWidth - 100, gameConfigHeight - 100,
        //     "MENU", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        // MenuText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        // MenuText.setDepth(999999);
        // MenuText.setScrollFactor(0);//スクロールに影響されなくなる


        //テキストを作成
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.gameScene);
        const MenuText = messageObjectInstance.createTextObject(this.gameScene, 0, 0, ['MENU'], 32);
        MenuText.setDepth(999999)
        MenuText.setScrollFactor(0);//スクロールに影響されなくなる
        MenuText.x = gameConfigWidth - MenuText.width - 64;
        MenuText.y = gameConfigHeight - MenuText.height - 64;

        //ウィンドウを作成
        const messageWindowInstance = new MessageWindow(this.gameScene);
        messageWindowInstance.init();
        messageWindowInstance.createOneColumnOneWindow(MenuText);
        messageWindowInstance.setDepth(MenuText.depth - 10);
        messageWindowInstance.setScrollFactor(0);

        MenuText.setInteractive({
            useHandCursor: true  // マウスオーバーでカーソルが指マークになる
        });

        MenuText.on(Phaser.Input.Events.POINTER_UP, async (
            pointer: Phaser.Input.Pointer,
            localX: number,
            localY: number,
            event: Phaser.Types.Input.EventData) => {

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            this.openMenu();
            this.test();
        });
    }

    private openMenu() {
        const mainCamera: Phaser.Cameras.Scene2D.Camera = this.gameScene.cameras.main;
        //ぼかし
        //https://newdocs.phaser.io/docs/3.70.0/Phaser.GameObjects.Components.FX#addBlur
        mainCamera.postFX.addBlur(2, 1, 1, 1, 0xffffff, 1);

        //画面更新を停止
        this.gameScene.scene.pause();
        //このシーンを消さずにメニューシーンを表示する
        this.gameScene.scene.launch('Menu');
    }

    private test() {
        //テスト処理


    }
}