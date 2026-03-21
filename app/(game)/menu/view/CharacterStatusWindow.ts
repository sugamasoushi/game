import { GameScene } from "../../lib/types";
import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";

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

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const Label = messageObject.createTextObject(this.scene, leftLabelX, leftLabelY, ['LV', 'HP', 'MP'], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

        const playerData = this.menuModel.getPlayerData();

        const charCondition = messageObject.createTextObject(this.scene, rightValueX, rightValueY, [
            String(playerData.Lv),
            playerData.HP + " / " + playerData.MaxHP,
            playerData.MP + " / " + playerData.MaxMP,
        ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

        this.container.add([charImage, Label, charCondition]).setDepth(this.mainWindowDepth + 50);
        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
