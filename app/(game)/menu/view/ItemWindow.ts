import { GameScene } from "../../lib/types";
import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";

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

        const itemList = this.menuModel.getValidItemList();

        for (let i = 0; i < itemList.length; i++) {
            if (i % 2 === 0) {
                const j = i > 0 ? i - 1 : i;
                const itemName = this.scene.add.text(itemX, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    itemList[i],
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemName]);
                
                const itemValue = this.scene.add.text(itemX + 200, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    this.menuModel.getPlayerItemCount(itemList[i]),
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemValue]);
            } else {
                const j = i > 0 ? i - 1 : i;
                const itemName = this.scene.add.text(itemX + rightValue, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    itemList[i],
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemName]);
                
                const itemValue = this.scene.add.text(itemX + rightValue + 200, itemY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    this.menuModel.getPlayerItemCount(itemList[i]),
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([itemValue]);
            }
        }
        this.container.setDepth(this.mainWindowDepth + 50);
        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
