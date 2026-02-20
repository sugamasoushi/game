import { MessageWindow } from "../util/MessageWindow";
import { MessageObject } from "../util/MessageObject";
import { GameScene } from "../lib/types";
import DebugMessage from '../util/DebugMessage';

export default class Menu extends Phaser.Scene {

    private gameScene: GameScene

    //ボタン
    private BackButton: Phaser.GameObjects.Text;

    private displayWidth: number;
    private displayHeight: number;

    //フォント設定
    private fontFamily: string;
    private fontColor: string;
    private fontSize: number;
    private lineSpaceValue: number;
    private textLine: number;

    private backColor: number;
    private alphaValue: number;
    private lineColor: number;

    //ウィンドウカーソル
    private allowObj: Phaser.GameObjects.Graphics;
    private nowAllowChoiceNo: number;
    private nextAllowChoiceNo: number;
    private allowTween: Phaser.Tweens.Tween;

    private containtsX = 0;//メインウィンドウの左上
    private containtsY = 0;
    private scrollValue: number;

    private cropRectMask: Phaser.GameObjects.Graphics;

    private mainColumn: string[] = ['コンディション', 'アイテム', '装備', 'スキル', 'ステータス', 'セーブ', 'オプション'];

    private nowMainColumnNo = 0;
    private nextMainColumnNo = 0;

    private mainColumnLabelText: Phaser.GameObjects.Text[] = [];
    private mainColumnLabelWindow: Phaser.GameObjects.Graphics[] = [];

    private mainWindow: Phaser.GameObjects.Graphics;

    private mainWindowDepth: number = 500;
    private messageWidth: number;
    private keyCode: string;
    private pointerOperation: string;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;

    private containerArray: Phaser.GameObjects.Container[] = [];//各コンテナを配列で管理
    private characterStatusContainer: Phaser.GameObjects.Container;
    private itemContainer: Phaser.GameObjects.Container;
    private equipContainer: Phaser.GameObjects.Container;
    private skillContainer: Phaser.GameObjects.Container;
    private charStatusContainer: Phaser.GameObjects.Container;
    private saveContainer: Phaser.GameObjects.Container;
    private optionContainer: Phaser.GameObjects.Container;

    constructor() { super('Main'); }

    init() {
        const settingData = this.cache.json.get('savedata').GameSetting.EventWindow;
        this.fontFamily = settingData.fontFamily;
        this.fontColor = settingData.fontColor;
        this.fontSize = settingData.fontSize;
        this.lineSpaceValue = settingData.lineSpaceValue;
        this.textLine = settingData.textLine;

        const settingBubbleData = this.cache.json.get('savedata').GameSetting.MessageWindow;
        this.backColor = settingBubbleData.backColor;
        this.alphaValue = settingBubbleData.alphaValue;
        this.lineColor = settingBubbleData.lineColor;

        this.messageWidth = 1000;//メッセージの範囲
        this.keyCode = 'keydown-A';
        this.pointerOperation = 'pointerdown';

        this.displayWidth = Number(this.game.config.width);
        this.displayHeight = Number(this.game.config.height);

        this.cameras.main.fadeIn(100);
        this.gameScene = (this.scene.get('Game') as GameScene);
        //キーボード設定
        this.cursors = this.input.keyboard!.createCursorKeys();

        //マウスポインタ—を初期化
        //https://developer.mozilla.org/en-US/docs/Web/CSS/cursor
        //default,pointer,help,wait...etc
        //※phaserはブラウザが管理するマウス設定キーを使用しているだけなので上記のキーはphaserのドキュメントには無い。他にもありそう。
        this.input.setDefaultCursor('default');
    }

    create() {

        //戻るボタン
        this.BackButton = this.add.text(
            1150, 50,
            "✖", { fontFamily: "Arial Black", fontSize: 32, color: "#00a6ed" });
        this.BackButton.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true);
        this.BackButton.setDepth(Number(this.game.config.height));
        this.BackButton.setScrollFactor(0);//TalkSceneのオブジェクトDepthも設定する事
        this.BackButton.setInteractive({ useHandCursor: true });
        this.BackButton.on('pointerdown', () => {
            this.backScene();
        }, this);

        this.createMainWindow();
        this.createCharacterStatus();
        this.createItem();
        this.createEuip();
        this.createSkill();
        this.createCharStatus();
        this.createSave();
        this.createOption();

        this.createAllow();
    }

    update() {
        this.updateMainColumnLabelWindow();
        this._updateAllow();
    }

    private createMainWindow() {
        const leftLabelX = 150;//画面端からのラベルの距離
        let labelDisplayWidth = 0;
        const leftLabelY = 100;

        //ラベル---------------------------------------------------------
        //ラベルテキストを作成
        for (let i = 0; i < this.mainColumn.length; i++) {
            const text = this.add.text(leftLabelX, leftLabelY, this.mainColumn[i], {
                fontFamily: this.fontFamily,
                fontSize: this.fontSize,
                lineSpacing: this.lineSpaceValue,
                color: this.fontColor
            });
            text.setDepth(this.mainWindowDepth);
            this.mainColumnLabelText.push(text);
        }

        // |---text1-text2-text3-text4-text5-text6---|
        //最初と最後のテキストを除外し、その間の幅を求める
        labelDisplayWidth = this.displayWidth - leftLabelX * 2 - this.mainColumnLabelText[0].width - this.mainColumnLabelText[this.mainColumnLabelText.length - 1].width;//ラベル全体の幅

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
            this.mainColumnLabelWindow.push(this.add.graphics());

            const windowWidth = this.mainColumnLabelText[i].width + rectR * 2;
            const windowHeight = this.mainColumnLabelText[i].height + rectR * 2;

            this.mainColumnLabelWindow[i].x = this.mainColumnLabelText[i].x;//座標初期値を設定テキストの左上
            this.mainColumnLabelWindow[i].y = this.mainColumnLabelText[i].y;
            this.mainColumnLabelWindow[i].fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
            this.mainColumnLabelWindow[i].fillRoundedRect(-1 * rectR, -1 * rectR, windowWidth, windowHeight, rectR);
            this.mainColumnLabelWindow[i].lineStyle(2, this.lineColor, 1);
            this.mainColumnLabelWindow[i].strokeRoundedRect(-1 * rectR, -1 * rectR, windowWidth, windowHeight, rectR);
            this.mainColumnLabelWindow[i].setDepth(this.mainWindowDepth - 1);
        }

        //テキストをクリック可能にする
        this.mainColumnLabelText.forEach(array => {
            array.setInteractive({ useHandCursor: true });
            array.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        });

        //メインウィンドウ-------------------------------------
        //ラベル下のメインウィンドウを作成
        const addWidth = 10;
        const mainWindowX = leftLabelX - addWidth;//画面端からのラベルの距離
        const mainWindowY = leftLabelY - addWidth;

        const mainWindowWidth = this.displayWidth - mainWindowX * 2;
        const mainWindowHeight = this.displayHeight - mainWindowY * 2;
        this.scrollValue = mainWindowWidth;//スクロール数

        this.mainWindow = this.add.graphics();
        this.mainWindow.x = mainWindowX;//座標初期値を設定テキストの左上
        this.mainWindow.y = mainWindowY;
        this.mainWindow.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.mainWindow.fillRoundedRect(-1 * rectR, -1 * rectR, mainWindowWidth + rectR * 2, mainWindowHeight, rectR);
        this.mainWindow.lineStyle(2, this.lineColor, 1);
        this.mainWindow.strokeRoundedRect(-1 * rectR, -1 * rectR, mainWindowWidth + rectR * 2, mainWindowHeight, rectR);
        this.mainWindow.setDepth(this.mainWindowDepth - 2);

        //メッセージ表示のマスク作成
        this.cropRectMask = this.add.graphics();
        this.cropRectMask.x = mainWindowX;//座標初期値を設定
        this.cropRectMask.y = mainWindowY + 80;
        this.cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        this.cropRectMask.fillRect(0, 0, mainWindowWidth, mainWindowHeight - 80 - rectR * 2);
        this.cropRectMask.setAlpha(0.5);
        //cropRectMask.fillPath().setDepth(messageObject.depth - 1);//確認用
        this.cropRectMask.setVisible(false);//非表示にする

        //以下の座標がメインウィンドウに表示するテキストの左上座標
        this.containtsX = this.cropRectMask.x;
        this.containtsY = this.cropRectMask.y;

        //クリック選択中のラベル番号を更新
        const duration = 200;
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            this.mainColumnLabelText[i].on('pointerdown', () => {
                if (i !== this.nowMainColumnNo) {
                    //現在の項目から右の項目がクリックされた場合
                    if ((i - this.nowMainColumnNo) > 0) {//nowNo-nextNo
                        this.containerArray[i].x = this.containtsX + this.scrollValue;//tween開始前に右に配置

                        //現在のコンテンツを左に移動
                        this.tweens.add({
                            targets: this.containerArray[this.nowMainColumnNo],
                            x: this.containerArray[this.nowMainColumnNo].x - this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                //tween終了後、x座標を更新。位置は画面外であればどこでもいい
                                this.containerArray[this.nowMainColumnNo].x = this.containtsX + this.scrollValue;
                            }
                        });

                        //表示するコンテンツを右に配置後、移動する
                        this.tweens.add({
                            targets: this.containerArray[i],
                            x: this.containerArray[i].x - this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                //tween終了後、x座標を更新
                                this.containerArray[i].x = this.containtsX;
                                this.nextMainColumnNo = i;
                            }
                        });
                    };

                    //現在の項目から左の項目がクリックされた場合
                    if ((i - this.nowMainColumnNo) < 0) {//nowNo-nextNo
                        this.containerArray[i].x = this.containtsX - this.scrollValue;//tween開始前に左に配置

                        //現在のコンテンツを右に移動
                        this.tweens.add({
                            targets: this.containerArray[this.nowMainColumnNo],
                            x: this.containerArray[this.nowMainColumnNo].x + this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                //tween終了後、x座標を更新。位置は画面外であればどこでもいい
                                this.containerArray[this.nowMainColumnNo].x = this.containtsX + this.scrollValue;
                            }
                        });

                        //表示するコンテンツを左に配置後、移動する
                        this.tweens.add({
                            targets: this.containerArray[i],
                            x: this.containerArray[i].x + this.scrollValue,
                            duration: duration,
                            ease: 'quad.out',
                            onComplete: () => {
                                //tween終了後、x座標を更新
                                this.containerArray[i].x = this.containtsX;
                                this.nextMainColumnNo = i;
                            }
                        });
                    };
                }
                this.nowMainColumnNo = i;
            }, this.scene);
        }
    }

    private updateMainColumnLabelWindow() {
        //クリック選択中のラベル番号を更新
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            if (this.nowMainColumnNo === i) {
                this.mainColumnLabelText[i].setTint(Phaser.Display.Color.GetColor(255, 255, 255));
            } else {
                this.mainColumnLabelText[i].setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            }
        }
    }

    private createAllow() {
        this.allowObj = this.add.graphics();

        this.allowObj.x = this.containtsX;
        this.allowObj.y = this.containtsY;
        const pointX = 0;
        const pointY = 0 + this.fontSize / 2;
        this.allowObj.fillStyle(this.lineColor, 1).setAlpha(this.alphaValue);
        this.allowObj.fillTriangle(pointX, pointY, pointX - this.fontSize / 2, pointY - this.fontSize / 2, pointX - this.fontSize / 2, pointY + this.fontSize / 2);
        this.allowObj.setDepth(this.mainWindowDepth + 1);
        this.allowObj.name = "allow"

        this.allowTween = this.add.tween({
            targets: this.allowObj,
            x: this.containtsX + 3,
            ease: 'sine.inout',
            duration: 500,
            repeat: -1,
            yoyo: true
        });
        this.allowObj.setVisible(false);
    }

    _updateAllow() {
        if (this.nextMainColumnNo === this.nowMainColumnNo) return;
        this.allowObj.setVisible(false);

        //選択中のメニューがアイテムの場合
        if (this.nowMainColumnNo === 1) {

            //テキストをクリック可能にする
            for (let i = 0; i < this.containerArray[this.nowMainColumnNo].list.length; i++) {
                //コンテナには、0番目は項目名、1番目は個数、2番目は項目名、3番目は個数・・・
                if (i % 2 === 0 && this.containerArray[this.nowMainColumnNo].list[i].type === "Text") {
                    this.containerArray[this.nowMainColumnNo].list[i].setInteractive({ useHandCursor: true });
                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerover', () => {
                        this.allowObj.setVisible(true);

                        this.allowObj.x = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).x + this.containtsX - 5;
                        this.allowObj.y = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).y + this.containtsY;

                        this.allowTween.destroy();
                        this.allowTween = this.add.tween({
                            targets: this.allowObj,
                            x: this.allowObj.x + 3,
                            ease: 'sine.inout',
                            duration: 500,
                            repeat: -1,
                            yoyo: true
                        });
                    }, this.scene)

                    //クリック時の処理
                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                        //左クリック
                        if (pointer.leftButtonDown()) {
                            pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
                            const debugMessage = new DebugMessage(this);
                            debugMessage.NotImplemented(undefined);
                            this.gameScene.events.emit('GAME_INPUT_TRUE');
                        }
                    }, this.scene)
                }
            }
            //選択中のメニューが装備、スキル、セーブ、オプションの場合
        } else if (this.nowMainColumnNo === 2 || this.nowMainColumnNo === 3 || this.nowMainColumnNo === 5 || this.nowMainColumnNo === 6) {

            //テキストをクリック可能にする
            for (let i = 0; i < this.containerArray[this.nowMainColumnNo].list.length; i++) {
                if (this.containerArray[this.nowMainColumnNo].list[i].type === "Text") {
                    if (i % 2 !== 0) {//奇数の場合は左に配置
                        this.containerArray[this.nowMainColumnNo].list[i].setInteractive({ useHandCursor: true });
                    }
                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerover', () => {
                        this.allowObj.setVisible(true);

                        this.allowObj.x = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).x + this.containtsX - 5;
                        this.allowObj.y = (this.containerArray[this.nowMainColumnNo].list[i] as Phaser.GameObjects.Container).y + this.containtsY;

                        this.allowTween.destroy();
                        this.allowTween = this.add.tween({
                            targets: this.allowObj,
                            x: this.allowObj.x + 3,
                            ease: 'sine.inout',
                            duration: 500,
                            repeat: -1,
                            yoyo: true
                        });
                    }, this.scene)
                    this.containerArray[this.nowMainColumnNo].list[i].on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                        //左クリック
                        if (pointer.leftButtonDown()) {
                            pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
                            const debugMessage = new DebugMessage(this);
                            debugMessage.NotImplemented(undefined);
                            this.gameScene.events.emit('GAME_INPUT_TRUE');
                        }
                    }, this.scene)
                }
            }
        }
    }

    //キャラクターステータス
    private createCharacterStatus() {
        const containtsX = this.containtsX;//メニューシーン開始時はこのコンテンツから開始する
        const containtsY = this.containtsY;
        const leftLabelX = 430;
        const leftLabelY = 0;
        const rightValueX = leftLabelX + 100;
        const rightValueY = leftLabelY;

        //コンテナを作成。コンテナに格納したオブジェクトはコンテナの座標を基準に配置される。
        this.characterStatusContainer = this.add.container(containtsX, containtsY);
        const charImage = this.add.image(150, 650, '20250609').setScale(0.6).setDepth(this.mainWindowDepth + 50);

        //左：ステータス項目
        const Label = this.add.text(leftLabelX, leftLabelY, ['LV', 'HP', 'MP'], {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            lineSpacing: this.lineSpaceValue,
            color: this.fontColor
        }).setDepth(this.mainWindowDepth + 50);

        console.log(this.gameScene.getPlayer())

        //右：ステータス値
        const charCondition = this.add.text(rightValueX, rightValueY, [
            this.gameScene.getPlayer().data.list.Lv,
            this.gameScene.getPlayer().data.list.HP + " / " + this.gameScene.getPlayer().data.list.MaxHP,
            this.gameScene.getPlayer().data.list.MP + " / " + this.gameScene.getPlayer().data.list.MaxMP,
        ], {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            lineSpacing: this.lineSpaceValue,
            color: this.fontColor
        }).setDepth(this.mainWindowDepth + 50);
        this.characterStatusContainer.add([charImage, Label, charCondition]).setDepth(this.mainWindowDepth + 50);

        //配列に格納
        this.containerArray.push(this.characterStatusContainer);

        this.characterStatusContainer.setMask(this.cropRectMask.createGeometryMask());
    }

    private createItem() {
        const containtsX = this.containtsX + this.scrollValue;//デフォルト
        const containtsY = this.containtsY;
        const itemX = 430;
        const itemY = 0;
        const rightValue = 300;//右列

        //コンテナを作成。コンテナに格納したオブジェクトはコンテナの座標を基準に配置される。
        this.itemContainer = this.add.container(containtsX, containtsY);

        const itemList: string[] = [];
        Object.keys(this.gameScene.getPlayer().data.list).forEach(array => {

            //下記以外の項目を対象
            if (array !== 'Lv' && array !== 'HP' && array !== 'MP' && array !== 'MaxHP' && array !== 'MaxMP' &&
                array !== 'Attack' && array !== 'Guard' && array !== 'Speed' &&
                array !== 'Weapon' && array !== 'Armor' &&
                array !== 'normalSkill' && array !== 'specialSkill' && array !== 'MagicSkill' &&
                array !== 'name' && array !== 'ImageKey'
            ) {
                itemList.push(array);
            }
        });

        // console.log(itemList)

        //アイテムリストは2列で表示する
        for (let i = 0; i < itemList.length; i++) {
            if (i % 2 === 0) {//偶数の場合は左に配置
                const j = i > 0 ? i - 1 : i;
                //左　項目
                const itemName = this.add.text(itemX, itemY + j * (this.lineSpaceValue + this.fontSize), [
                    itemList[i],
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.itemContainer.add([itemName]);
                //右　個数
                const itemValue = this.add.text(itemX + 200, itemY + j * (this.lineSpaceValue + this.fontSize), [
                    this.gameScene.getPlayer().getData(itemList[i]),
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.itemContainer.add([itemValue]);
            } else {//奇数の場合は右に配置
                const j = i > 0 ? i - 1 : i;
                //左　項目
                const itemName = this.add.text(itemX + rightValue, itemY + j * (this.lineSpaceValue + this.fontSize), [
                    itemList[i],
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.itemContainer.add([itemName]);
                //右　個数
                const itemValue = this.add.text(itemX + rightValue + 200, itemY + j * (this.lineSpaceValue + this.fontSize), [
                    this.gameScene.getPlayer().getData(itemList[i]),
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.itemContainer.add([itemValue]);
            }
        }
        this.itemContainer.setDepth(this.mainWindowDepth + 50);

        //配列に格納
        this.containerArray.push(this.itemContainer);

        this.itemContainer.setMask(this.cropRectMask.createGeometryMask());
    }

    private createEuip() {
        const containtsNo = 1;
        const containtsX = this.containtsX + this.scrollValue * containtsNo;
        const containtsY = this.containtsY;
        const equipX = 430;
        const equipY = 0;
        const rightValue = 200;//右列

        //コンテナを作成。コンテナに格納したオブジェクトはコンテナの座標を基準に配置される。
        this.equipContainer = this.add.container(containtsX, containtsY);

        const array = [this.gameScene.getPlayer().data.list.Weapon, this.gameScene.getPlayer().data.list.Armor];

        for (let i = 0; i < array.length; i++) {
            if (i % 2 === 0) {//偶数の場合は左に配置
                const j = i > 0 ? i - 1 : i;
                //左：項目
                const Label = this.add.text(equipX, equipY + j * (this.lineSpaceValue + this.fontSize), ['E'], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                //右：値
                const charEquip = this.add.text(equipX + 50, equipY + j * (this.lineSpaceValue + this.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.equipContainer.add([Label, charEquip]).setDepth(this.mainWindowDepth + 50);
            } else {//奇数の場合は右に配置
                const j = i > 0 ? i - 1 : i;
                //左：項目
                const Label = this.add.text(equipX + rightValue, equipY + j * (this.lineSpaceValue + this.fontSize), ['E'], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                //右：値
                const charEquip = this.add.text(equipX + rightValue + 50, equipY + j * (this.lineSpaceValue + this.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.equipContainer.add([Label, charEquip]).setDepth(this.mainWindowDepth + 50);
            }
        }

        //配列に格納
        this.containerArray.push(this.equipContainer);

        this.equipContainer.setMask(this.cropRectMask.createGeometryMask());
    }

    private createSkill() {
        const containtsNo = 1;
        const containtsX = this.containtsX + this.scrollValue * containtsNo;
        const containtsY = this.containtsY;
        const skillX = 430;
        const skillY = 0;
        const rightValue = 200;//右列

        //コンテナを作成。コンテナに格納したオブジェクトはコンテナの座標を基準に配置される。
        this.skillContainer = this.add.container(containtsX, containtsY);

        const array = ['切り付け', '悪口'];

        for (let i = 0; i < array.length; i++) {
            if (i % 2 === 0) {//偶数の場合は左に配置
                const j = i > 0 ? i - 1 : i;
                //左：項目
                const Label = this.add.text(skillX, skillY + j * (this.lineSpaceValue + this.fontSize), ['E'], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                //右：値
                const skill = this.add.text(skillX + 50, skillY + j * (this.lineSpaceValue + this.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.skillContainer.add([Label, skill]).setDepth(this.mainWindowDepth + 50);
            } else {//奇数の場合は右に配置
                const j = i > 0 ? i - 1 : i;
                //左：項目
                const Label = this.add.text(skillX + rightValue, skillY + j * (this.lineSpaceValue + this.fontSize), ['E'], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                //右：値
                const skill = this.add.text(skillX + rightValue + 50, skillY + j * (this.lineSpaceValue + this.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.fontFamily,
                    fontSize: this.fontSize,
                    lineSpacing: this.lineSpaceValue,
                    color: this.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.skillContainer.add([Label, skill]).setDepth(this.mainWindowDepth + 50);
            }
        }

        //配列に格納
        this.containerArray.push(this.skillContainer);

        this.skillContainer.setMask(this.cropRectMask.createGeometryMask());
    }

    private createCharStatus() {
        const containtsNo = 1;
        const containtsX = this.containtsX + this.scrollValue * containtsNo;
        const containtsY = this.containtsY;
        const leftLabelX = 430;
        const leftLabelY = 0;
        const rightValueX = leftLabelX + 100;
        const rightValueY = leftLabelY;

        //コンテナを作成。コンテナに格納したオブジェクトはコンテナの座標を基準に配置される。
        this.charStatusContainer = this.add.container(containtsX, containtsY);

        //左：項目
        const Label = this.add.text(leftLabelX, leftLabelY, ['Lv', 'HP', 'MP', '性格', '攻撃力', '防御力', '運'], {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            lineSpacing: this.lineSpaceValue,
            color: this.fontColor
        }).setDepth(this.mainWindowDepth + 50);

        //右：値
        const charStatus = this.add.text(rightValueX, rightValueY, [
            this.gameScene.getPlayer().data.list.Lv,
            this.gameScene.getPlayer().data.list.MaxHP,
            this.gameScene.getPlayer().data.list.MaxMP,
            '能天気',
            10,
            5,
            0
        ], {
            fontFamily: this.fontFamily,
            fontSize: this.fontSize,
            lineSpacing: this.lineSpaceValue,
            color: this.fontColor
        }).setDepth(this.mainWindowDepth + 50);

        this.charStatusContainer.add([Label, charStatus]).setDepth(this.mainWindowDepth + 50);

        //配列に格納
        this.containerArray.push(this.charStatusContainer);

        this.charStatusContainer.setMask(this.cropRectMask.createGeometryMask());
    }

    private createSave() {
        const containtsNo = 1;
        const containtsX = this.containtsX + this.scrollValue * containtsNo;
        const containtsY = this.containtsY;
        const saveX = 100;
        const saveY = 0;

        //コンテナを作成。コンテナに格納したオブジェクトはコンテナの座標を基準に配置される。
        this.saveContainer = this.add.container(containtsX, containtsY);

        const array = ['空き', '空き'];

        for (let i = 0; i < array.length; i++) {
            //左：項目
            const Label = this.add.text(saveX, saveY + i * (this.lineSpaceValue + this.fontSize), ['セーブスロット ' + i], {
                fontFamily: this.fontFamily,
                fontSize: this.fontSize,
                lineSpacing: this.lineSpaceValue,
                color: this.fontColor
            }).setDepth(this.mainWindowDepth + 50);

            //右：値
            const skill = this.add.text(saveX + 200, saveY + i * (this.lineSpaceValue + this.fontSize), [
                array[i]
            ], {
                fontFamily: this.fontFamily,
                fontSize: this.fontSize,
                lineSpacing: this.lineSpaceValue,
                color: this.fontColor
            }).setDepth(this.mainWindowDepth + 50);
            this.saveContainer.add([Label, skill]).setDepth(this.mainWindowDepth + 50);
        }

        //配列に格納
        this.containerArray.push(this.saveContainer);

        this.saveContainer.setMask(this.cropRectMask.createGeometryMask());
    }

    private createOption() {
        const containtsNo = 1;
        const containtsX = this.containtsX + this.scrollValue * containtsNo;
        const containtsY = this.containtsY;
        const optionX = 100;
        const optionY = 0;

        //コンテナを作成。コンテナに格納したオブジェクトはコンテナの座標を基準に配置される。
        this.optionContainer = this.add.container(containtsX, containtsY);

        const array = ['テキストスピード', 'ゲーム終了'];

        for (let i = 0; i < array.length; i++) {
            //左：項目
            const Label = this.add.text(optionX, optionY + i * (this.lineSpaceValue + this.fontSize), ['　'], {
                fontFamily: this.fontFamily,
                fontSize: this.fontSize,
                lineSpacing: this.lineSpaceValue,
                color: this.fontColor
            }).setDepth(this.mainWindowDepth + 50);

            //右：値
            const option = this.add.text(optionX + 10, optionY + i * (this.lineSpaceValue + this.fontSize), [
                array[i]
            ], {
                fontFamily: this.fontFamily,
                fontSize: this.fontSize,
                lineSpacing: this.lineSpaceValue,
                color: this.fontColor
            }).setDepth(this.mainWindowDepth + 50);
            this.optionContainer.add([Label, option]).setDepth(this.mainWindowDepth + 50);
        }

        //配列に格納
        this.containerArray.push(this.optionContainer);

        this.optionContainer.setMask(this.cropRectMask.createGeometryMask());
    }

    //メニューシーンを終了
    backScene() {

        // FX
        const pixelated = this.cameras.main.postFX.addPixelate(-1);
        this.add.tween({
            targets: pixelated,
            duration: 700,
            amount: 40,
            onComplete: () => {
                this.cameras.main.fadeOut(100);
                this.mainColumnLabelText = [];//クリア
                this.mainColumnLabelWindow = [];
                this.containerArray = [];
                this.nowMainColumnNo = 0;
                this.scene.stop();
                this.gameScene.resumeScene();
                // if (this.gameScene.eventFlag) {
                //     this.gameScene.eventFlag = false;
                // }
            }
        });
    }

}