import { MenuModel } from "../model/MenuModel";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { MenuTab } from "../MenuTypes";

export class MainColumnWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;

    public BackButton: Phaser.GameObjects.Text;

    private displayWidth: number;
    private displayHeight: number;

    private mainWindowDepth: number = 500;
    public mainWindow: MessageWindow;

    public containtsX = 0;
    public containtsY = 0;
    public scrollValue: number;

    public cropRectMask: Phaser.GameObjects.Graphics;

    public mainColumn: string[] = ['コンディション', 'アイテム', '装備', 'スキル', 'ステータス', 'MOVIE', 'オプション'];
    public nowMainColumnNo: MenuTab = MenuTab.Condition;
    public nextMainColumnNo: MenuTab = MenuTab.Condition;

    public mainColumnLabelText: Phaser.GameObjects.Text[] = [];
    public mainColumnLabelWindow: MessageWindow[] = [];

    private containerArray: Phaser.GameObjects.Container[] = []; //他のViewのコンテナを登録してもらう

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;

        this.displayWidth = Number(this.scene.game.config.width);
        this.displayHeight = Number(this.scene.game.config.height);
    }

    public create() {
        this.createBackButton();
        this.createMainWindow();
    }

    // 各Windowのコンテナを受け取るためのメソッド
    public setContainers(containers: Phaser.GameObjects.Container[]) {
        this.containerArray = containers;
    }

    private createBackButton() {
        this.BackButton = this.scene.add.text(
            1150, 50,
            "✖", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        this.BackButton.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.BackButton.setDepth(Number(this.scene.game.config.height));
        this.BackButton.setScrollFactor(0);
        this.BackButton.setInteractive({ useHandCursor: true });
        this.BackButton.on('pointerdown', () => {
            // プレゼンター側にイベントを通知
            this.scene.events.emit('MenuCloseClick');
        }, this);
    }

    private createMainWindow() {
        const leftLabelX = 150;
        let labelDisplayWidth = 0;
        const leftLabelY = 100;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        //'コンディション', 'アイテム', '装備', 'スキル', 'ステータス', 'セーブ', 'オプション'
        for (let i = 0; i < this.mainColumn.length; i++) {
            const text = messageObject.createTextObject(this.scene, leftLabelX, leftLabelY, this.mainColumn[i], this.menuModel.fontSize);
            text.setDepth(this.mainWindowDepth);
            this.mainColumnLabelText.push(text);
        }

        // |---text1-text2-text3-text4-text5-text6---|
        //最初と最後のテキストを除外し、その間の幅を求める
        labelDisplayWidth = this.displayWidth - leftLabelX * 2 - this.mainColumnLabelText[0].width - this.mainColumnLabelText[this.mainColumnLabelText.length - 1].width;

        //ラベル間の幅を算出、最初と最後の距離を計算する
        let width = labelDisplayWidth;
        for (let i = 1; i < this.mainColumnLabelText.length - 1; i++) {
            width -= this.mainColumnLabelText[i].width;
        }
        width = width / (this.mainColumnLabelText.length - 1);

        //配置
        let labelWidth = 0;
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            this.mainColumnLabelText[i].x = leftLabelX + labelWidth;
            labelWidth += this.mainColumnLabelText[i].width + width;
        }

        //ラベルボックスを作成
        const rectR = 8;
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            const labelWindow = new MessageWindow(this.scene);
            labelWindow.init();
            labelWindow.createOneColumnOneWindow(this.mainColumnLabelText[i], rectR);
            this.mainColumnLabelWindow.push(labelWindow);
        }

        //テキストをクリック可能にする
        this.mainColumnLabelText.forEach(array => {
            array.setInteractive({ useHandCursor: true });
            array.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        });

        //ラベル下のメインウィンドウを作成
        const addWidth = 10;
        const mainWindowX = leftLabelX - addWidth;
        const mainWindowY = leftLabelY - addWidth;

        const mainWindowWidth = this.displayWidth - mainWindowX * 2;
        const mainWindowHeight = this.displayHeight - mainWindowY * 2;
        this.scrollValue = mainWindowWidth;

        this.mainWindow = new MessageWindow(this.scene);
        this.mainWindow.init();

        const winX = mainWindowX - 2 * rectR;
        const winY = mainWindowY - 2 * rectR;
        const winW = mainWindowWidth + 2 * rectR;
        const winH = mainWindowHeight;

        this.mainWindow.createMessageWindow(winX, winY, winW, winH, rectR, this.mainWindowDepth - 2);

        //メッセージ表示のマスク作成
        this.cropRectMask = this.scene.add.graphics();
        this.cropRectMask.x = mainWindowX;
        this.cropRectMask.y = mainWindowY + 80;
        this.cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        this.cropRectMask.fillRect(0, 0, mainWindowWidth, mainWindowHeight - 80 - rectR * 2);
        this.cropRectMask.setAlpha(0.5);
        this.cropRectMask.setVisible(false);

        //以下の座標がメインウィンドウに表示するテキストの左上座標
        this.containtsX = this.cropRectMask.x;
        this.containtsY = this.cropRectMask.y;

        //初期表示はコンディションを選択状態にする
        this.mainColumnLabelText[MenuTab.Condition].setTint(Phaser.Display.Color.GetColor(255, 255, 255));

        this.windowTween();

    }

    //クリックした項目に対応するコンテンツをスライド表示させる
    private windowTween() {
        const duration = 200;

        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            this.mainColumnLabelText[i].on('pointerdown', () => {

                // コンテナ配列が空の場合は何もしない（エラー防止）
                if (this.containerArray.length === 0) return;

                // 全てのラベルの色を灰色に戻す
                for (const ColumnLabelText of this.mainColumnLabelText) {
                    ColumnLabelText.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
                }
                // クリックしたラベルの色を白くする
                this.mainColumnLabelText[i].setTint(Phaser.Display.Color.GetColor(255, 255, 255));

                //選択中の項目と異なる項目がクリックされた場合
                if (i !== this.nowMainColumnNo) {

                    //選択中の項目より右の項目がクリックされた場合
                    if ((i - this.nowMainColumnNo) > 0) {

                        //表示するコンテンツを右に配置
                        this.containerArray[i].x = this.containtsX + this.scrollValue;

                        //現在のコンテンツを左に移動
                        this.scene.tweens.add({
                            targets: this.containerArray[this.nowMainColumnNo],
                            x: this.containerArray[this.nowMainColumnNo].x - this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[this.nowMainColumnNo].x = this.containtsX + this.scrollValue;
                            }
                        });

                        //表示するコンテンツを左に移動する
                        this.scene.tweens.add({
                            targets: this.containerArray[i],
                            x: this.containerArray[i].x - this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[i].x = this.containtsX;
                                this.nextMainColumnNo = i;
                            }
                        });
                    };

                    //選択中の項目より左の項目がクリックされた場合
                    if ((i - this.nowMainColumnNo) < 0) {

                        //表示するコンテンツを左に配置
                        this.containerArray[i].x = this.containtsX - this.scrollValue;

                        //現在のコンテンツを右に移動
                        this.scene.tweens.add({
                            targets: this.containerArray[this.nowMainColumnNo],
                            x: this.containerArray[this.nowMainColumnNo].x + this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[this.nowMainColumnNo].x = this.containtsX + this.scrollValue;
                            }
                        });

                        //表示するコンテンツを左に移動する
                        this.scene.tweens.add({
                            targets: this.containerArray[i],
                            x: this.containerArray[i].x + this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                this.containerArray[i].x = this.containtsX;
                                this.nextMainColumnNo = i;
                            }
                        });
                    };
                }
                this.nowMainColumnNo = i as MenuTab;
            }, this.scene);
        }
    }

    //終了アニメーション
    public executeEndAnimation(onComplete: () => void) {
        const pixelated = this.scene.cameras.main.postFX.addPixelate(-1);
        this.scene.add.tween({
            targets: pixelated,
            duration: 700,
            amount: 40,
            onComplete: () => {
                this.scene.cameras.main.fadeOut(100);
                this.mainColumnLabelText = [];
                this.mainColumnLabelWindow = [];
                this.containerArray = [];
                this.nowMainColumnNo = MenuTab.Condition;
                onComplete();
            }
        });
    }

}
