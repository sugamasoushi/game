import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";
import { GameStateManager } from '../../GameAllState/GameStateManager';
import { State } from '../../lib/types';

export class MenuButton {

    constructor(private gameScene: Phaser.Scene) { }

    public async execute() {
        this.createMenuButton();
    }

    private createMenuButton() {
        const gameConfigWidth: number = Number(this.gameScene.game.canvas.width);
        const gameConfigHeight: number = Number(this.gameScene.game.canvas.height);

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
        // this.gameScene.scene.pause();
        // //このシーンを消さずにメニューシーンを表示する
        // this.gameScene.scene.launch('Menu');

        //状態管理クラス
        const gameStateManager = GameStateManager.getInstance();

        //状態更新
        gameStateManager.updateState({ state: State.MENU }, 'MenuOpen');
    }

    private test() {
        //テスト処理


    }
}