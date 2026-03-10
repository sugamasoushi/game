import { ReadyEvents } from '../../lib/typesGamescene';
import { GameScene } from "../../lib/types";

export class MenuButton {
    private gameScene: GameScene;

    constructor(scene: GameScene) { this.gameScene = scene; }

    public async execute() {


        this.createMenuButton();
        //this.gameScene.events.emit(this.ReadyEventsKey.MENUBUTTON);

    }

    private createMenuButton() {
        const gameConfigWidth: number = Number(this.gameScene.game.config.width);
        const gameConfigHeight: number = Number(this.gameScene.game.config.height);

        const MenuText = this.gameScene.add.text(gameConfigWidth - 100, gameConfigHeight - 100,
            "MENU", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        MenuText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        MenuText.setDepth(999999);
        MenuText.setScrollFactor(0);//スクロールに影響されなくなる

        MenuText.setInteractive({
            useHandCursor: true  // マウスオーバーでカーソルが指マークになる
        });
        MenuText.on('pointerdown', () => {
            //this.scene.MenuText.disableInteractive();
            this.openMenu();
        });
    }

    private openMenu() {
        const mainCamera: Phaser.Cameras.Scene2D.Camera = this.gameScene.getMainCamera();
        //ぼかし
        //https://newdocs.phaser.io/docs/3.70.0/Phaser.GameObjects.Components.FX#addBlur
        mainCamera.postFX.addBlur(2, 1, 1, 1, 0xffffff, 1);

        //画面更新を停止
        this.gameScene.scene.pause();
        //このシーンを消さずにメニューシーンを表示する
        this.gameScene.scene.launch('Main');
    }
}