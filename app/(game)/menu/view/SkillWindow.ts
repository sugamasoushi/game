import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";

export class SkillWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;
    }

    public create(mainColumn: MainColumnWindow) {
        const skillX = 430;
        const skillY = 0;
        const rightValue = 200;

        this.container = this.scene.add.container(mainColumn.containtsX + mainColumn.scrollValue * 3, mainColumn.containtsY);

        const array = ['切り付け', '悪口'];

        for (let i = 0; i < array.length; i++) {
            if (i % 2 === 0) {
                const j = i > 0 ? i - 1 : i;
                const Label = this.scene.add.text(skillX, skillY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['E'], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                const skill = this.scene.add.text(skillX + 50, skillY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([Label, skill]).setDepth(this.mainWindowDepth + 50);
            } else {
                const j = i > 0 ? i - 1 : i;
                const Label = this.scene.add.text(skillX + rightValue, skillY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['E'], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);

                const skill = this.scene.add.text(skillX + rightValue + 50, skillY + j * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                    array[i]
                ], {
                    fontFamily: this.menuModel.fontFamily,
                    fontSize: this.menuModel.fontSize,
                    lineSpacing: this.menuModel.lineSpaceValue,
                    color: this.menuModel.fontColor
                }).setDepth(this.mainWindowDepth + 50);
                this.container.add([Label, skill]).setDepth(this.mainWindowDepth + 50);
            }
        }

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
