import { GameScene } from "../../lib/types";
import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";

export class ItemWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;
    }

    public create(mainColumn: MainColumnWindow) {
        const itemX = 430;
        const itemY = 0;
        const rightValue = 300;

        // 初期配置時は右にずらしておく (scrollValue * 1など。mainColumnで上書きされるが初期位置として)
        this.container = this.scene.add.container(mainColumn.containtsX + mainColumn.scrollValue, mainColumn.containtsY);

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const itemList = this.menuModel.getValidItemList();

        for (let i = 0; i < itemList.length; i++) {
            if (i % 2 === 0) {
                const j = i > 0 ? i - 1 : i;
                const itemName = messageObject.createTextObject(this.scene, itemX, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    itemList[i],
                ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemName]);
                
                const itemValue = messageObject.createTextObject(this.scene, itemX + 200, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    this.menuModel.getPlayerItemCount(itemList[i]).toString(),
                ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemValue]);
            } else {
                const j = i > 0 ? i - 1 : i;
                const itemName = messageObject.createTextObject(this.scene, itemX + rightValue, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    itemList[i],
                ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemName]);
                
                const itemValue = messageObject.createTextObject(this.scene, itemX + rightValue + 200, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    this.menuModel.getPlayerItemCount(itemList[i]).toString(),
                ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemValue]);
            }
        }
        this.container.setDepth(this.mainWindowDepth + 50);
        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
