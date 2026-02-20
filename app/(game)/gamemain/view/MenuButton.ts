import { ReadyEvents } from '../../lib/typesGamescene';
import { GameScene } from "../../lib/types";

export class MenuButton {
    private gameScene: GameScene;

    constructor(scene: GameScene) { this.gameScene = scene; }

    public async execute() {


        this.createMenuButton();
        this.createTestButton();

        //this.gameScene.events.emit(this.ReadyEventsKey.MENUBUTTON);

    }

    private createMenuButton() {
        const gameConfigWidth: number = Number(this.gameScene.game.config.width);
        const gameConfigHeight: number = Number(this.gameScene.game.config.height);

        const MenuText = this.gameScene.add.text(gameConfigWidth - 100, gameConfigHeight - 100,
            "MENU", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        MenuText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        MenuText.setDepth(gameConfigHeight);
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


    //テスト用のボタン
    private createTestButton() {
        const gameConfigWidth: number = Number(this.gameScene.game.config.width);
        const gameConfigHeight: number = Number(this.gameScene.game.config.height);

        const MenuText = this.gameScene.add.text(
            gameConfigWidth - 100, gameConfigHeight - 200,
            "TEST", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        MenuText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        MenuText.setDepth(gameConfigHeight);
        MenuText.setScrollFactor(0);//スクロールに影響されなくなる

        MenuText.setInteractive({
            useHandCursor: true  // マウスオーバーでカーソルが指マークになる
        });
        MenuText.on('pointerdown', () => {

            //zone.removeInteractive();//クリック後、クリック操作を削除
            console.log(this.gameScene.getPlayer());
            console.log(this.gameScene);
            console.log(this.gameScene.children.getChildren())
            const list: Phaser.GameObjects.GameObject[] = [];
            this.gameScene.children.getChildren().map(obj => {
                if (obj.type === "Sprite") {
                    list.push(obj)
                }
            })
            console.log(list);

            //画面更新を停止
            //this.scene.scene.pause();
            // this.talkScene = this.scene.scene.get('BattleScene');
            //this.scene.scene.launch('BattleScene');

        });
    }

}