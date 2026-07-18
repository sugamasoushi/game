import { MenuModel } from "../model/MenuModel";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { MenuTab } from "../../lib/types";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { GameSettingData } from "../../Data/GameSettingData";
import { Sound } from "../../scenes/Sound";

export class MainColumnWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;

    public BackButton: Phaser.GameObjects.Text;

    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    private displayWidth: number;
    private displayHeight: number;

    private mainWindowDepth: number = 500;
    public mainWindow: MessageWindow;

    public containtsX = 0;
    public containtsY = 0;
    public scrollValue: number;

    public cropRectMask: Phaser.GameObjects.Graphics;

    public mainColumn: string[] = ['コンディション', 'アイテム', '装備', 'フィールドスキル', 'ステータス', 'セーブ'];
    public nowMainColumnNo: MenuTab = MenuTab.Condition;
    public nextMainColumnNo: MenuTab = MenuTab.Condition;

    public mainColumnLabelText: Phaser.GameObjects.Text[] = [];
    public mainColumnLabelWindow: MessageWindow[] = [];

    private containerArray: Phaser.GameObjects.Container[] = []; //他のViewのコンテナを登録してもらう

    private subs = new Subscription();
    private isAnimating: boolean = false;
    private isItemSelectMode: boolean = false;
    private scaleTween: Phaser.Tweens.Tween | null = null;

    private soundScene: Sound;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;

        this.displayWidth = Number(this.scene.game.config.width);
        this.displayHeight = Number(this.scene.game.config.height);
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public create() {
        //this.createBackButton();
        this.backButtonCreate(1150, 50);
        this.createMainWindow();
    }

    /**
     * MainColumnWindow は Phaser の GameObject ではないため、Scene 停止時に
     * 自動では RxJS 購読が解除されない。MenuView から明示的に呼び出す。
     */
    public destroy() {
        this.subs.unsubscribe();
        this.scaleTween?.stop();
        this.scaleTween = null;
        this.containerArray = [];
    }

    // 各Windowのコンテナを受け取るためのメソッド
    public setContainers(containers: Phaser.GameObjects.Container[]) {
        this.containerArray = containers;
    }

    private backButtonCreate(x: number, y: number) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        messageObjectInstance.getTextInfomation();

        this.backButton = messageObjectInstance.createTextObject(this.scene, x, y + 16, "✖");
        this.backButton.setDepth(Number(this.scene.game.config.height) + 1);

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        // createMessageWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        // 左右の余白を等しく設定
        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y + 16;
        this.backButtonWindow.setDepth(Number(this.scene.game.config.height));

        this.backButton.setDepth(this.backButtonWindow.depth + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
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

        //'コンディション', 'アイテム', '装備', 'フィールドスキル', 'ステータス', 'セーブ', 'MOVIE'
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
            const text = this.mainColumnLabelText[i];
            const labelWindow = new MessageWindow(this.scene);
            labelWindow.init();
            labelWindow.createOneColumnOneWindow(text, rectR);
            this.mainColumnLabelWindow.push(labelWindow);

            // ウィンドウ作成後に中央基準に変更し、座標を補正
            text.setOrigin(0.5);
            text.x = text.x + text.width / 2;
            text.y = text.y + text.height / 2;
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
        this.windowTweenPadKeyBoard();
        this.updateTabAnimation();
    }

    //クリックした項目に対応するコンテンツをスライド表示させる
    private windowTween() {
        for (let i = 0; i < this.mainColumnLabelText.length; i++) {
            this.mainColumnLabelText[i].on('pointerdown', () => {
                this.shiftToTab(i);

                // 詳細選択モードならタブ選択に戻す
                this.isItemSelectMode = false;

                // 全てのモード終了イベントを一律で投げるか、現在に合わせて投げる
                const eventNames = ['ConditionSelectModeEnd', 'StatusSelectModeEnd', 'ItemSelectModeEnd', 'EquipSelectModeEnd', 'SkillSelectModeEnd', 'SaveSelectModeEnd', 'MovieSelectModeEnd'];
                eventNames.forEach(name => this.scene.events.emit(name));
            }, this.scene);
        }
    }

    private windowTweenPadKeyBoard() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        // 右に入力された場合
        this.subs.add(inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.isItemSelectMode) return; // アイテム選択モード中はタブを切り替えない
            let nextIndex = this.nowMainColumnNo + 1;
            if (nextIndex >= this.mainColumnLabelText.length) {
                nextIndex = 0;
            }
            this.shiftToTab(nextIndex);
        }));

        // 左に入力された場合
        this.subs.add(inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.isItemSelectMode) return; // アイテム選択モード中はタブを切り替えない
            let nextIndex = this.nowMainColumnNo - 1;
            if (nextIndex < 0) {
                nextIndex = this.mainColumnLabelText.length - 1;
            }
            this.shiftToTab(nextIndex);
        }));

        // キャンセル（×ボタン）が入力された場合
        this.subs.add(inputManager.cancelButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (this.isItemSelectMode) {
                // 詳細選択モードならタブ選択に戻す
                this.isItemSelectMode = false;

                // 全てのモード終了イベントを一律で投げるか、現在に合わせて投げる
                const eventNames = ['ConditionSelectModeEnd', 'StatusSelectModeEnd', 'ItemSelectModeEnd', 'EquipSelectModeEnd', 'SkillSelectModeEnd', 'SaveSelectModeEnd', 'MovieSelectModeEnd'];
                eventNames.forEach(name => this.scene.events.emit(name));

                this.updateTabAnimation(); // アニメーション再開
            } else {
                // タブ選択中ならメニューを閉じる
                this.scene.events.emit('MenuCloseClick');
            }
        }));

        // 決定（〇ボタン）が入力された場合
        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            this.tryEnterItemSelectMode();
        }));
    }

    private tryEnterItemSelectMode() {
        if (!this.isItemSelectMode) {
            // コンディション画面のみ決定操作を受け付けない
            if (this.nowMainColumnNo === MenuTab.Condition) return;

            let eventName = '';
            switch (this.nowMainColumnNo) {
                //case MenuTab.Condition: eventName = 'ConditionSelectModeStart'; break;
                case MenuTab.Status: eventName = 'StatusSelectModeStart'; break;
                case MenuTab.Item: eventName = 'ItemSelectModeStart'; break;
                case MenuTab.Equip: eventName = 'EquipSelectModeStart'; break;
                case MenuTab.Skill: eventName = 'SkillSelectModeStart'; break;
                case MenuTab.Save: eventName = 'SaveSelectModeStart'; break;
                case MenuTab.Movie: eventName = 'MovieSelectModeStart'; break;
            }

            if (eventName) {
                this.isItemSelectMode = true;
                this.scene.events.emit(eventName);
                this.updateTabAnimation(); // アニメーション停止
            }
        }
    }

    // 共通のタブ切り替え処理
    private shiftToTab(targetIndex: number) {
        // コンテナ配列が空の場合は何もしない（エラー防止）
        if (this.containerArray.length === 0) return;
        if (targetIndex === this.nowMainColumnNo) return;
        if (this.isAnimating) return; // アニメーション中なら無視

        this.isAnimating = true;
        this.updateTabAnimation(); // スクロール開始時にアニメーションを停止
        const duration = 200;

        this.soundScene.playSe('SE_cardTurnOver');

        // 全てのラベルの色を灰色に戻す
        for (const ColumnLabelText of this.mainColumnLabelText) {
            ColumnLabelText.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        }
        // クリックしたラベルの色を白くする
        this.mainColumnLabelText[targetIndex].setTint(Phaser.Display.Color.GetColor(255, 255, 255));

        //表示するコンテンツを右からスライドさせる場合
        if ((targetIndex - this.nowMainColumnNo) > 0) {

            //表示するコンテンツを右に配置
            this.containerArray[targetIndex].x = this.containtsX + this.scrollValue;

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
                targets: this.containerArray[targetIndex],
                x: this.containerArray[targetIndex].x - this.scrollValue,
                duration: duration,
                ease: 'quad.out',
                onComplete: () => {
                    this.containerArray[targetIndex].x = this.containtsX;
                    this.nextMainColumnNo = targetIndex;
                    this.isAnimating = false;
                    this.updateTabAnimation();
                }
            });
        }
        //表示するコンテンツを左からスライドさせる場合
        else if ((targetIndex - this.nowMainColumnNo) < 0) {

            //表示するコンテンツを左に配置
            this.containerArray[targetIndex].x = this.containtsX - this.scrollValue;

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

            //表示するコンテンツを右に移動する
            this.scene.tweens.add({
                targets: this.containerArray[targetIndex],
                x: this.containerArray[targetIndex].x + this.scrollValue,
                duration: duration,
                ease: 'quad.out',
                onComplete: () => {
                    this.containerArray[targetIndex].x = this.containtsX;
                    this.nextMainColumnNo = targetIndex;
                    this.isAnimating = false;
                    this.updateTabAnimation();
                }
            });
        }
        this.nowMainColumnNo = targetIndex as MenuTab;
    }

    //終了アニメーション
    public executeEndAnimation(onComplete: () => void) {
        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }
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
                this.isItemSelectMode = false;
                this.destroy();
                onComplete();
            }
        });
    }

    private updateTabAnimation() {
        // 既存的Tweenがあれば停止
        if (this.scaleTween) {
            this.scaleTween.stop();
            this.scaleTween = null;
        }

        // 全てのテキストのスケールをリセット
        for (const text of this.mainColumnLabelText) {
            if (text.active) {
                text.setScale(1);
            }
        }

        // アイテム選択モード中、またはアニメーション中の場合はアニメーションしない
        if (this.isItemSelectMode || this.isAnimating) return;

        // 現在選択されているタブに対してTweenを開始
        const target = this.mainColumnLabelText[this.nowMainColumnNo];
        if (target && target.active) {
            this.scaleTween = this.scene.tweens.add({
                targets: target,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 500,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }
}
