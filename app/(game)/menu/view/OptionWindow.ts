import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";

export class OptionWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;
    }

    public create(mainColumn: MainColumnWindow) {
        const optionX = 100;
        const optionY = 0;

        this.container = this.scene.add.container(mainColumn.containtsX + mainColumn.scrollValue * 6, mainColumn.containtsY);

        const array = ['テキストスピード', 'ゲーム終了'];

        for (let i = 0; i < array.length; i++) {
            const Label = this.scene.add.text(optionX, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['　'], {
                fontFamily: this.menuModel.fontFamily,
                fontSize: this.menuModel.fontSize,
                lineSpacing: this.menuModel.lineSpaceValue,
                color: this.menuModel.fontColor
            }).setDepth(this.mainWindowDepth + 50);

            const option = this.scene.add.text(optionX + 10, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                array[i]
            ], {
                fontFamily: this.menuModel.fontFamily,
                fontSize: this.menuModel.fontSize,
                lineSpacing: this.menuModel.lineSpaceValue,
                color: this.menuModel.fontColor
            }).setDepth(this.mainWindowDepth + 50);
            this.container.add([Label, option]).setDepth(this.mainWindowDepth + 50);
        }

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
