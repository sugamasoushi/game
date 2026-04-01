import { MenuModel } from "../model/MenuModel";
import { Menu } from "../../scenes/Menu";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';
import { ListWindow } from "../../util/ListWindow";
import { DataDefinition } from "../../Data/DataDefinition";
import { MessageWindow } from "../../util/MessageWindow";
import { MenuListWindow } from "./MenuListWindow";

export class ItemWindow extends Phaser.GameObjects.Container {
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;
    private itemNameList: Phaser.GameObjects.Text[] = [];

    private listWindow: ListWindow;
    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    private menuListWindow: MenuListWindow;

    constructor(scene: Phaser.Scene, private menuModel: MenuModel) {
        super(scene);
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow) {
        const itemX = 430;
        const itemY = 0;
        const rightValue = 300;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Item;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const itemList = this.menuModel.getValidItemList();

        // アイテムリストは2列で表示する
        for (let i = 0; i < itemList.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const xOffset = col * rightValue;
            const yOffset = row * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            //左　項目
            const itemName = messageObject.createTextObject(
                this.scene,
                itemX + xOffset,
                itemY + yOffset,
                [itemList[i]],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            //右　個数
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
                this.selectAllow.updatePosition(itemName);
            });

            // クリックでアイテムを使用
            itemName.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.itemNameDisableInteractive();
                    this.scene.input.setDefaultCursor('default');

                    //アイテムが0以上かチェック
                    const count = this.menuModel.getItemData().values[itemName.text];
                    if (count <= 0 || count == undefined) {
                        const debugMessage = new DebugMessage(this.scene);
                        debugMessage.NotImplemented('もう無いよ！');
                        return;
                    }

                    //パーティメンバーが2人以上の場合、使用するメンバーを選択する
                    if (this.menuModel.getPlayerPartyList().length > 1) {

                        const dataDefinition = new DataDefinition();

                        const partyname: string[] = [];
                        for (let i = 0; i < this.menuModel.getPlayerPartyList().length; i++) {
                            const charcterName = dataDefinition.getSpriteNameData(this.scene, this.menuModel.getPlayerPartyList()[i].name);
                            partyname.push(charcterName);
                        }

                        this.menuListWindow = new MenuListWindow(this.scene, this.menuModel);
                        // ウィンドウの位置を中央付近に設定
                        this.menuListWindow.x = 600;
                        this.menuListWindow.y = 250;
                        this.menuListWindow.create(partyname);

                        // 選択時の処理
                        this.menuListWindow.onSelect = (memberIndex: number) => {
                            // 使用後の個数を反映
                            itemValue.setText(this.useItem(itemName.text, memberIndex).toString());
                            this.closeMenuListWindow();
                        };

                        this.backButtonCreate(this.menuListWindow.x + 116, this.menuListWindow.y - 40);

                    } else {
                        // 使用後の個数を反映（メンバー1人の場合はインデックス0）
                        itemValue.setText(this.useItem(itemName.text, 0).toString());
                    }
                }
            });

            this.itemNameList.push(itemName);

        }

        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.selectAllow.setVisible(false);
        this.add(this.selectAllow);

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());
    }

    private backButtonCreate(x: number, y: number) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);

        this.backButton = messageObjectInstance.createTextObject(this.scene, x, y + 16, "✖");

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y + 16;

        // 深度設定
        const baseDepth = this.menuListWindow ? this.menuListWindow.depth + 10 : 1000;
        this.backButtonWindow.setDepth(baseDepth);
        this.backButton.setDepth(baseDepth + 1);

        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.closeMenuListWindow();
        }, this);
    }

    private closeMenuListWindow() {
        if (this.menuListWindow) this.menuListWindow.destroy();
        if (this.backButton) this.backButton.destroy();
        if (this.backButtonWindow) this.backButtonWindow.destroy();
        this.itemNameEnableInteractive();
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
            itemName.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        }
    }

    private itemNameEnableInteractive() {
        for (const itemName of this.itemNameList) {
            itemName.setInteractive({ useHandCursor: true });
            itemName.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        }
    }
}
