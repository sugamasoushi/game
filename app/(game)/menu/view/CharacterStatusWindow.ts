import { GameScene } from "../../lib/types";
import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";

export class CharacterStatusWindow {

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

        this.container = this.scene.add.container(mainColumn.containtsX, mainColumn.containtsY);
        const charImage = this.scene.add.image(150, 650, '20250609').setScale(0.6).setDepth(this.mainWindowDepth + 50);

        const Label = this.scene.add.text(leftLabelX, leftLabelY, ['LV', 'HP', 'MP'], {
            fontFamily: this.menuModel.fontFamily,
            fontSize: this.menuModel.fontSize,
            lineSpacing: this.menuModel.lineSpaceValue,
            color: this.menuModel.fontColor
        }).setDepth(this.mainWindowDepth + 50);

        const playerData = this.menuModel.getPlayerData();

        const charCondition = this.scene.add.text(rightValueX, rightValueY, [
            playerData.Lv,
            playerData.HP + " / " + playerData.MaxHP,
            playerData.MP + " / " + playerData.MaxMP,
        ], {
            fontFamily: this.menuModel.fontFamily,
            fontSize: this.menuModel.fontSize,
            lineSpacing: this.menuModel.lineSpaceValue,
            color: this.menuModel.fontColor
        }).setDepth(this.mainWindowDepth + 50);

        this.container.add([charImage, Label, charCondition]).setDepth(this.mainWindowDepth + 50);
        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
