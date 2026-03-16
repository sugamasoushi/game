import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";

export class SaveWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;
    }

    public create(mainColumn: MainColumnWindow) {
        const saveX = 100;
        const saveY = 0;

        this.container = this.scene.add.container(mainColumn.containtsX + mainColumn.scrollValue * 5, mainColumn.containtsY);

        const array = ['空き', '空き'];

        for (let i = 0; i < array.length; i++) {
            const Label = this.scene.add.text(saveX, saveY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['セーブスロット ' + i], {
                fontFamily: this.menuModel.fontFamily,
                fontSize: this.menuModel.fontSize,
                lineSpacing: this.menuModel.lineSpaceValue,
                color: this.menuModel.fontColor
            }).setDepth(this.mainWindowDepth + 50);

            const skill = this.scene.add.text(saveX + 200, saveY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                array[i]
            ], {
                fontFamily: this.menuModel.fontFamily,
                fontSize: this.menuModel.fontSize,
                lineSpacing: this.menuModel.lineSpaceValue,
                color: this.menuModel.fontColor
            }).setDepth(this.mainWindowDepth + 50);
            this.container.add([Label, skill]).setDepth(this.mainWindowDepth + 50);
        }

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
