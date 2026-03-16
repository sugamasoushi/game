import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";

export class EquipWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;
    }

    public create(mainColumn: MainColumnWindow) {
        const equipX = 430;
        const equipY = 0;
        const rightValue = 200;

        this.container = this.scene.add.container(mainColumn.containtsX + mainColumn.scrollValue * 2, mainColumn.containtsY);

        const playerData = this.menuModel.getPlayerData();
        const array = [playerData.Weapon, playerData.Armor];

        for (let i = 0; i < array.length; i++) {
            if (i % 2 === 0) {
                const j = i > 0 ? i - 1 : i;
                const Label = this.scene.add.text(equipX, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['E'], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                const charEquip = this.scene.add.text(equipX + 50, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([Label, charEquip]).setDepth(this.mainWindowDepth + 50);
            } else {
                const j = i > 0 ? i - 1 : i;
                const Label = this.scene.add.text(equipX + rightValue, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['E'], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                const charEquip = this.scene.add.text(equipX + rightValue + 50, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([Label, charEquip]).setDepth(this.mainWindowDepth + 50);
            }
        }

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
