import { BattleScene } from "../../lib/types";
import { BattleModel } from "../model/BattleModel";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";
import { SelectAllow } from "../../util/SelectAllow";
import { SaveDataManager } from "../../core/SaveDataManager";
import { GameSettingData } from "../../Data/GameSettingData";
import { SearchCharacterData } from "../../Data/SearchCharacterData";
import { CharacterSelectWindow } from "../../util/CharacterSelectWindow";
import { Sound } from "../../scenes/Sound";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";

export class ItemSelectWindow extends Phaser.GameObjects.Container {
    private battleScene: BattleScene;
    private battleModel: BattleModel;

    private windowMarginX = 200;
    private windowHeight = 200;

    private selectList: Phaser.GameObjects.Text[] = [];
    private countList: Phaser.GameObjects.Text[] = [];
    private selectListWindow: CharacterSelectWindow;

    private nowSelectNo = 0;
    private maxColumns = 2;

    private messageWindow: MessageWindow;
    private allow: SelectAllow;
    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    public selectAllow: SelectAllow;

    private soundScene: Sound;
    private subs = new Subscription();
    private canDecide: boolean = false;

    constructor(battleScene: BattleScene, battleModel: BattleModel) {
        super(battleScene);
        this.scene.add.existing(this);
        this.name = ItemSelectWindow.name;
        this.battleModel = battleModel;
        this.soundScene = this.scene.scene.get('Sound') as Sound;
        this.setVisible(false);
        this.setActive(false);
        this.setupInput();
    }

    init() {
        this.x = 0;
        this.y = 0;
        this.name = ItemSelectWindow.name;
    }

    private createItemList() {
        const textX = this.windowMarginX + 60;
        const textY = Number(this.scene.game.canvas.height) - this.windowHeight + 20;

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        const { lineSpaceValue, fontSize } = messageObjectInstance.getTextInfomation();

        //戦闘プレイヤーのデータを取得後、Lvやスキル等、アイテム以外の項目を除外
        const saveDataManager = new SaveDataManager();
        const itemList: string[] = [];
        Object.keys(this.battleModel.getPlayerPartyList()[0].data.list).forEach(array => {
            if (saveDataManager.checkItemListData(array)) {
                itemList.push(array);
            }
        });

        for (const [i, listName] of itemList.entries()) {

            const count = this.battleModel.getPlayerPartyList()[0].data.values[listName];

            //左　項目
            const textObj = messageObjectInstance.createTextObject(this.scene, 0, 0, listName);
            textObj.name = listName;

            //右　個数
            const countObj = messageObjectInstance.createTextObject(this.scene, 0, 0, count ? count.toString() : "0");

            // 2列表示の座標計算
            const col = i % this.maxColumns;
            const row = Math.floor(i / this.maxColumns);
            const columnWidth = 400; // 列の幅

            textObj.x = textX + (col * columnWidth);
            textObj.y = textY + (row * (textObj.height + lineSpaceValue));
            textObj.setDepth(Number(this.scene.game.config.height) + 1);

            countObj.x = textObj.x + textObj.width + 50;
            countObj.y = textObj.y;
            countObj.setDepth(Number(this.scene.game.config.height) + 1);

            // 初期表示時の個数チェックによりグレーアウトを設定
            if (count <= 0 || count == undefined) {
                textObj.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
                countObj.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
                textObj.disableInteractive();
            }

            textObj.on('pointerover', () => {
                this.allow.updatePosition(textObj);
                this.nowSelectNo = i;
            }, this);

            textObj.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.disableSelect();
                    this.scene.input.setDefaultCursor('default');

                    //パーティメンバーが2人以上の場合、使用するメンバーを選択する
                    if (this.battleModel.getPlayerPartyList().length > 1) {

                        const searchCharacterData = new SearchCharacterData(this.scene.cache.json);

                        const partyname: string[] = [];
                        for (let i = 0; i < this.battleModel.getPlayerPartyList().length; i++) {
                            const charcterName = searchCharacterData.getDisplayName(this.battleModel.getPlayerPartyList()[i].name);
                            partyname.push(charcterName);
                        }

                        this.selectListWindow = new CharacterSelectWindow(this.scene);
                        // ウィンドウの位置を中央付近に設定

                        this.selectListWindow.create(partyname);
                        this.selectListWindow.x = textObj.x + 150;
                        this.selectListWindow.y = 400;
                        this.selectListWindow.setDepth(900);
                        this.selectListWindow.show();

                        // 選択時の処理
                        this.selectListWindow.onSelect = (memberIndex: number) => {

                            // 使用後の個数を反映
                            this.battleModel.getPlayerPartyList()[0].data.values[listName] -= 1;
                            const count = this.battleModel.getPlayerPartyList()[0].data.values[listName];
                            // プレゼンター側にイベントを通知（memberIndex を含める）
                            this.scene.events.emit('USE_ITEM', listName, count, memberIndex);

                            countObj.setText(count.toString());
                            if (count <= 0) {
                                textObj.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
                                countObj.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
                            }
                            this.closeMenuListWindow();
                            this.setActive(true);
                            this.enableSelect();
                            this.selectExec(listName);
                        };

                        //リストウィンドウの戻るが押されたときの処理
                        this.selectListWindow.onBack = () => {
                            this.closeMenuListWindow();
                            this.setActive(true);
                            this.enableSelect();
                        };

                    } else {
                        this.soundScene.playSe('SE_newsTitle');

                        // 使用後の個数を反映（メンバー1人の場合はインデックス0）
                        this.battleModel.getPlayerPartyList()[0].data.values[listName] -= 1;
                        const count = this.battleModel.getPlayerPartyList()[0].data.values[listName];
                        // プレゼンター側にイベントを通知（memberIndex を含める）
                        this.scene.events.emit('USE_ITEM', listName, count, 0);

                        countObj.setText(count.toString());
                        if (count <= 0) {
                            textObj.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
                            countObj.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
                        }
                        this.setActive(true);
                        this.enableSelect();
                        this.selectExec(listName);
                    }

                    this.scene.input.setDefaultCursor('default');
                }
            }, this);

            this.selectList.push(textObj);
            this.countList.push(countObj);
        }
    }

    private setupInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(this.maxColumns);
        }));
        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(-this.maxColumns);
        }));
        this.subs.add(inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(1);
        }));
        this.subs.add(inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active) return;
            this.navigate(-1);
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            if (this.selectList.length > 0) {
                const itemText = this.selectList[this.nowSelectNo];
                // 既存のクリックイベントを発火させる
                itemText.emit('pointerdown', { leftButtonDown: () => true, reset: () => { } });
            }
        }));

        this.subs.add(inputManager.cancelButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.visible || !this.active || !this.canDecide) return;
            this.backSubmit();
        }));
    }

    private navigate(delta: number) {
        const maxNo = this.selectList.length;
        if (maxNo === 0) return;

        let newSelectNo = this.nowSelectNo + delta;
        if (newSelectNo < 0) newSelectNo = 0;
        if (newSelectNo >= maxNo) newSelectNo = maxNo - 1;

        if (newSelectNo !== this.nowSelectNo) {
            this.nowSelectNo = newSelectNo;
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }
    }

    private backSubmit() {
        this.emit('Select_back_Submit');

        for (const list of this.selectList) {
            list.destroy();
        }
        this.selectList = [];

        for (const countText of this.countList) {
            countText.destroy();
        }
        this.countList = [];

        this.nowSelectNo = 0;
        this.hide();
    }

    private createWindow() {

        if (this.messageWindow) {
            this.messageWindow.destroy();
        }

        //ウィンドウ作成
        const messageWindowInstance = new MessageWindow(this.scene);
        messageWindowInstance.init();
        messageWindowInstance.createEventMessageWindow(this.selectList[0]);
        this.messageWindow = messageWindowInstance;

        //戻るボタン
        this.backButtonCreate(this.messageWindow.x + this.messageWindow.width - 16, this.messageWindow.y - 16);

        //カーソル作成、初期位置設定
        this.allow = new SelectAllow(this.scene);
        this.allow.init(0, 0);
        this.allow.createAllow();
        if (this.selectList.length > 0) {
            this.allow.updatePosition(this.selectList[this.nowSelectNo]);
        }
        this.allow.setDepth(Number(this.scene.game.config.height) + 1);

        //クリック可能に設定
        this.enableSelect();

        //初期は非表示
        this.messageWindow.setVisible(false);
        this.allow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);
    }

    private backButtonCreate(x: number, y: number) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        messageObjectInstance.getTextInfomation();

        this.backButton = messageObjectInstance.createTextObject(this.scene, x - 48, y + 48, "✖");
        this.backButton.setDepth(Number(this.scene.game.config.height) + 1);

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        // createMessageWindow内で(rectR, rectR)の位置に描画されるため、-rectRして位置を合わせる
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        // 左右の余白を等しく設定
        this.backButtonWindow.x = x - 48;
        this.backButtonWindow.y = y + 48;
        this.backButtonWindow.setDepth(Number(this.scene.game.config.height));

        this.backButton.setDepth(this.backButtonWindow.depth + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.backSubmit();
        }, this);
    }


    //選択実行
    private selectExec(listName: string) {
        this.emit('Use_Item_Submit', listName);
    }

    show() {
        this.nowSelectNo = 0;
        //アイテムリストの為、show()で作成
        this.createItemList();
        this.createWindow();

        this.messageWindow.setVisible(true);
        this.allow.setVisible(true);
        this.backButton.setVisible(true);
        this.backButtonWindow.setVisible(true);

        this.enableSelect();

        this.canDecide = false;
        this.scene.time.delayedCall(10, () => {
            this.canDecide = true;
        });
    }

    hide() {
        this.setVisible(false);
        this.setActive(false);

        this.messageWindow.setVisible(false);
        this.allow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);

        for (const list of this.selectList) {
            list.destroy();
        }
        this.selectList = [];

        for (const countText of this.countList) {
            countText.destroy();
        }
        this.countList = [];
    }

    move() { this.setActive(false); this.disableSelect(); }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        super.destroy(fromScene);
    }

    //テキストクリック可
    private enableSelect() {
        this.setVisible(true);
        this.setActive(true);
        for (const itemName of this.selectList) {

            // 個数をチェックして色を戻す
            const count = this.battleModel.getPlayerPartyList()[0].data.values[itemName.text];
            if (count > 0) {
                itemName.setInteractive({ useHandCursor: true });
                itemName.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
            } else {
                itemName.disableInteractive();
                itemName.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            }
        }
        this.backButton.setInteractive({ useHandCursor: true });
    }

    //テキストクリック不可
    private disableSelect() {
        this.setActive(false);
        this.allow.lightDown();
        for (const itemName of this.selectList) {
            itemName.disableInteractive();
            itemName.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        }
        this.backButton.disableInteractive();
    }

    private closeMenuListWindow() {
        if (this.selectListWindow) this.selectListWindow.destroy();

        for (const itemName of this.selectList) {

            // 個数をチェックして色を戻す
            const count = this.battleModel.getPlayerPartyList()[0].data.values[itemName.text];
            if (count > 0) {
                itemName.setInteractive({ useHandCursor: true });
                itemName.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
            } else {
                itemName.disableInteractive();
                itemName.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            }
        }
    }
}
