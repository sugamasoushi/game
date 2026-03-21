import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";

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

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const playerData = this.menuModel.getPlayerData();
        const array = [playerData.Weapon, playerData.Armor];

        for (let i = 0; i < array.length; i++) {
            if (i % 2 === 0) {
                const j = i > 0 ? i - 1 : i;
                const Label = messageObject.createTextObject(this.scene, equipX, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['E'], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

                const charEquip = messageObject.createTextObject(this.scene, equipX + 50, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    array[i]
                ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
                this.container.add([Label, charEquip]).setDepth(this.mainWindowDepth + 50);
            } else {
                const j = i > 0 ? i - 1 : i;
                const Label = messageObject.createTextObject(this.scene, equipX + rightValue, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['E'], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

                const charEquip = messageObject.createTextObject(this.scene, equipX + rightValue + 50, equipY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    array[i]
                ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
                this.container.add([Label, charEquip]).setDepth(this.mainWindowDepth + 50);
            }
        }

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
