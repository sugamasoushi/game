import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';
import { GameSettingData } from "../../Data/GameSettingData";
import { SearchCharacterData } from "../../Data/SearchCharacterData";

import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { Sound } from "../../scenes/Sound";
import { GeneralListSelectWindow } from "../../util/GeneralListSelectWindow";

export class ItemWindow extends Phaser.GameObjects.Container {
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;
    private itemNameList: Phaser.GameObjects.Text[] = [];


    private characterSelectWindow: GeneralListSelectWindow | null;

    private itemValueList: Phaser.GameObjects.Text[] = [];
    private isItemSelectMode: boolean = false;
    private canDecide: boolean = false;
    private selectedIndex: number = 0;
    private subs = new Subscription();

    private mainColumn: MainColumnWindow;

    private soundScene: Sound;

    constructor(scene: Phaser.Scene, private menuModel: MenuModel) {
        super(scene);
        this.scene.add.existing(this);
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public create(mainColumn: MainColumnWindow) {
        this.mainColumn = mainColumn;
        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Item;
        this.y = mainColumn.containtsY;

        this.drawItemList();

        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.selectAllow.setVisible(false);
        this.add(this.selectAllow);

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());

        this.setupPadKeyboardInput();
    }

    private drawItemList() {
        // 既存のオブジェクトを削除
        for (const itemName of this.itemNameList) itemName.destroy();
        for (const itemValue of this.itemValueList) itemValue.destroy();
        this.itemNameList = [];
        this.itemValueList = [];

        const itemX = 430;
        const itemY = 0;
        const rightValue = 300;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        // 個数が1個以上のアイテムのみを対象とする
        const allItems = this.menuModel.getValidItemList();
        const itemList = allItems.filter(item => this.menuModel.getPlayerItemCount(item) > 0);

        for (let i = 0; i < itemList.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const xOffset = col * rightValue;
            const yOffset = row * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            const itemName = messageObject.createTextObject(
                this.scene,
                itemX + xOffset,
                itemY + yOffset,
                [itemList[i]],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            const itemValue = messageObject.createTextObject(
                this.scene,
                itemX + xOffset + 200,
                itemY + yOffset,
                [this.menuModel.getPlayerItemCount(itemList[i]).toString()],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            this.add([itemName, itemValue]);

            // マウスオーバーで選択位置を更新
            itemName.setInteractive({ useHandCursor: true });
            itemName.on('pointerover', () => {
                if (this.isItemSelectMode && (!this.characterSelectWindow || !this.characterSelectWindow.visible)) {
                    this.selectedIndex = i;
                    this.selectAllow.updatePosition(itemName);
                }
            });

            // クリックでアイテムを使用
            itemName.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.soundScene.playSe('SE_decideButton');
                    this.selectedIndex = i;
                    this.execItemUse(i);
                }
            });

            this.itemNameList.push(itemName);
            this.itemValueList.push(itemValue);
        }

        if (this.selectAllow) {
            this.bringToTop(this.selectAllow);
        }
    }



    private closeCharacterSelectWindow(canselFlg: boolean = false) {
        if (canselFlg) {
            this.soundScene.playSe('SE_cancelButton');
        }

        if (this.characterSelectWindow) {
            this.characterSelectWindow.hide();
        }

        this.drawItemList();
        this.repositionCursor();
    }

    useItem(itemName: string, memberIndex: number = 0): number {
        const count = this.menuModel.getItemData().values[itemName] -= 1;
        // プレゼンター側にイベントを通知（memberIndex を含める）
        this.scene.events.emit('USE_ITEM', itemName, count, memberIndex);

        return count;
    }

    private itemNameDisableInteractive() {
        for (const itemName of this.itemNameList) {
            itemName.disableInteractive();
            // 一律グレーアウト
            itemName.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        }
    }

    private itemNameEnableInteractive() {
        for (const itemName of this.itemNameList) {
            // 個数をチェックして色とインタラクティブを制御
            const count = this.menuModel.getPlayerItemCount(itemName.text);
            if (count > 0) {
                itemName.setInteractive({ useHandCursor: true });
                itemName.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
            } else {
                itemName.disableInteractive();
                itemName.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            }
        }
    }

    private execItemUse(index: number) {
        if (index < 0 || index >= this.itemNameList.length) return;

        const itemName = this.itemNameList[index];

        // カーソルを停止・非表示にし、テキストをグレーアウト
        this.selectAllow.setVisible(false);
        this.itemNameDisableInteractive();
        this.scene.input.setDefaultCursor('default');

        //アイテムが0以上かチェック
        const count = this.menuModel.getItemData().values[itemName.text];
        if (count <= 0 || count == undefined) {
            const debugMessage = new DebugMessage(this.scene);
            debugMessage.NotImplemented('もう無いよ！');
            this.itemNameEnableInteractive();

            // 再びカーソルを表示（0個のアイテムを避ける）
            this.repositionCursor();
            return;
        }

        //パーティメンバーが2人以上の場合、使用するメンバーを選択する
        if (this.menuModel.getPlayerPartyList().length > 1) {

            const searchCharacterData = new SearchCharacterData(this.scene.cache.json);

            const partyname: string[] = [];
            for (let i = 0; i < this.menuModel.getPlayerPartyList().length; i++) {
                const charcterName = searchCharacterData.getDisplayName(this.menuModel.getPlayerPartyList()[i].name);
                partyname.push(charcterName);
            }

            if (!this.characterSelectWindow) {
                this.characterSelectWindow = new GeneralListSelectWindow(this.scene);
                // 深度を調整（必要に応じて）
                this.characterSelectWindow.setDepth(this.mainWindowDepth + 100);
            }

            // ウィンドウの位置を中央付近に設定
            this.characterSelectWindow.create(partyname);
            this.characterSelectWindow.x = 600;
            this.characterSelectWindow.y = 250;
            this.characterSelectWindow.show();

            // 選択時の処理
            this.characterSelectWindow.onSelect = (memberIndex: number) => {
                // 使用後の個数を反映
                this.useItem(itemName.text, memberIndex);
                this.closeCharacterSelectWindow();
            };

            // 戻るボタン押下時の処理
            this.characterSelectWindow.onBack = () => {
                this.closeCharacterSelectWindow(true);
            };

        } else {
            // 使用後の個数を反映（メンバー1人の場合はインデックス0）
            this.useItem(itemName.text, 0);
            this.drawItemList();
            this.repositionCursor();
        }
    }

    private setupPadKeyboardInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        const onSelectStart = () => {
            if (this.itemNameList.length > 0) {
                this.isItemSelectMode = true;
                this.canDecide = false;
                // 1フレーム待ってから決定可能にする
                this.scene.time.delayedCall(10, () => {
                    this.canDecide = true;
                });
                this.selectedIndex = 0;
                this.repositionCursor();
            }
        };

        const onSelectEnd = () => {
            this.isItemSelectMode = false;
            this.selectAllow.setVisible(false);
        };

        this.scene.events.on('ItemSelectModeStart', onSelectStart);
        this.scene.events.on('ItemSelectModeEnd', onSelectEnd);

        // カーソル移動
        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isItemSelectMode || (this.characterSelectWindow && this.characterSelectWindow.visible)) return;
            if (this.selectedIndex + 2 < this.itemNameList.length) {
                this.selectedIndex += 2;
                this.selectAllow.updatePosition(this.itemNameList[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isItemSelectMode || (this.characterSelectWindow && this.characterSelectWindow.visible)) return;
            if (this.selectedIndex - 2 >= 0) {
                this.selectedIndex -= 2;
                this.selectAllow.updatePosition(this.itemNameList[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.rightButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isItemSelectMode || (this.characterSelectWindow && this.characterSelectWindow.visible)) return;
            if (this.selectedIndex + 1 < this.itemNameList.length && this.selectedIndex % 2 === 0) {
                this.selectedIndex += 1;
                this.selectAllow.updatePosition(this.itemNameList[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.leftButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isItemSelectMode || (this.characterSelectWindow && this.characterSelectWindow.visible)) return;
            if (this.selectedIndex - 1 >= 0 && this.selectedIndex % 2 === 1) {
                this.selectedIndex -= 1;
                this.selectAllow.updatePosition(this.itemNameList[this.selectedIndex]);
            }
        }));

        // 決定
        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isItemSelectMode || !this.canDecide || (this.characterSelectWindow && this.characterSelectWindow.visible)) return;
            this.soundScene.playSe('SE_decideButton');
            this.execItemUse(this.selectedIndex);
        }));
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        this.scene.events.off('ItemSelectModeStart');
        this.scene.events.off('ItemSelectModeEnd');
        if (this.characterSelectWindow) {
            this.characterSelectWindow.destroy();
            this.characterSelectWindow = null;
        }
        super.destroy(fromScene);
    }

    private repositionCursor() {
        if (!this.isItemSelectMode) return;

        if (this.itemNameList.length > 0) {
            // インデックスが範囲外（アイテムが削除された場合）なら最後尾に調整
            if (this.selectedIndex >= this.itemNameList.length) {
                this.selectedIndex = this.itemNameList.length - 1;
            }

            // drawItemList で個数1以上のものに絞っているため、ここでは単に位置を合わせるだけで良い
            this.selectAllow.updatePosition(this.itemNameList[this.selectedIndex]);
            this.selectAllow.setVisible(true);
        } else {
            // アイテムが一つも無くなった場合
            this.selectAllow.setVisible(false);
        }
    }
}
