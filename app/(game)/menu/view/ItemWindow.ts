import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';

export class ItemWindow extends Phaser.GameObjects.Container {
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;

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

                    //アイテムが0以上かチェック
                    const count = this.menuModel.getItemData().values[itemName.text];
                    if (count <= 0 || count == undefined) {
                        const debugMessage = new DebugMessage(this.scene);
                        debugMessage.NotImplemented('もう無いよ！');
                        return;
                    }

                    // 使用後の個数を反映
                    itemValue.setText(this.useItem(itemName.text).toString());
                }
            });
        }

        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.selectAllow.setVisible(false);
        this.add(this.selectAllow);

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());
    }

    useItem(itemName: string): number {
        const count = this.menuModel.getItemData().values[itemName] -= 1;
        //console.log(count);

        this.scene.events.emit('USE_ITEM', itemName, count);

        return count;
    }
}
