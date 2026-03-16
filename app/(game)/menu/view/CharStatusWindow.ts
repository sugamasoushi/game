import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";

export class CharStatusWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;
    }

    public create(mainColumn: MainColumnWindow) {
        const leftLabelX = 430;
        const leftLabelY = 0;
        const rightValueX = leftLabelX + 100;
        const rightValueY = leftLabelY;

        this.container = this.scene.add.container(mainColumn.containtsX + mainColumn.scrollValue * 4, mainColumn.containtsY);

        const Label = this.scene.add.text(leftLabelX, leftLabelY, ['Lv', 'HP', 'MP', '性格', '攻撃力', '防御力', '運'], {
            fontFamily: this.menuModel.fontFamily,
            fontSize: this.menuModel.fontSize,
            lineSpacing: this.menuModel.lineSpaceValue,
            color: this.menuModel.fontColor
        }).setDepth(this.mainWindowDepth + 50);

        const playerData = this.menuModel.getPlayerData();

        const charStatus = this.scene.add.text(rightValueX, rightValueY, [
            playerData.Lv,
            playerData.MaxHP,
            playerData.MaxMP,
            '能天気',
            10,
            5,
            0
        ], {
            fontFamily: this.menuModel.fontFamily,
            fontSize: this.menuModel.fontSize,
            lineSpacing: this.menuModel.lineSpaceValue,
            color: this.menuModel.fontColor
        }).setDepth(this.mainWindowDepth + 50);

        this.container.add([Label, charStatus]).setDepth(this.mainWindowDepth + 50);

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
