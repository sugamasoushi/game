import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";

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

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const Label = messageObject.createTextObject(this.scene, leftLabelX, leftLabelY, ['Lv', 'HP', 'MP', '性格', '攻撃力', '防御力', '運'], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

        const playerData = this.menuModel.getPlayerData();

        const charStatus = messageObject.createTextObject(this.scene, rightValueX, rightValueY, [
            String(playerData.Lv),
            String(playerData.MaxHP),
            String(playerData.MaxMP),
            '能天気',
            '10',
            '5',
            '0'
        ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

        this.container.add([Label, charStatus]).setDepth(this.mainWindowDepth + 50);

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
