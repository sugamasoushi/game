import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";

export class CharStatusWindow extends Phaser.GameObjects.Container {

    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow) {
        const leftLabelX = 430;
        const leftLabelY = 0;
        const rightValueX = leftLabelX + 100;
        const rightValueY = leftLabelY;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Status;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const Label = messageObject.createTextObject(this.scene, leftLabelX, leftLabelY, ['Lv', 'HP', 'MP', '性格', '攻撃力', '防御力', '運'], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

        const playerData = this.menuModel.getPlayerDataList();

        const charStatus = messageObject.createTextObject(this.scene, rightValueX, rightValueY, [
            String(playerData.Lv),
            String(playerData.MaxHP),
            String(playerData.MaxMP),
            '能天気',
            '10',
            '5',
            '0'
        ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

        this.add([Label, charStatus]).setDepth(this.mainWindowDepth + 50);

        this.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
