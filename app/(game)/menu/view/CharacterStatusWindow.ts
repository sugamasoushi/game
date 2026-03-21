import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../MenuTypes";

export class CharacterStatusWindow extends Phaser.GameObjects.Container {

    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    private charConditionHP: Phaser.GameObjects.Text;
    private charConditionMP: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);

        this.once('destroy', () => {
            this.scene.events.off('UPDATE_CONDITION', this.updateConditionHandler, this);
        });
    }

    public create(mainColumn: MainColumnWindow) {
        const leftLabelX = 430;
        const leftLabelY = 0;
        const rightValueX = leftLabelX + 100;
        const rightValueY = leftLabelY;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Condition;
        this.y = mainColumn.containtsY;
        const charImage = this.scene.add.image(150, 650, '20250609').setScale(0.6).setDepth(this.mainWindowDepth + 50);

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const playerData = this.menuModel.getPlayerDataList();

        const labels = ['LV', 'HP', 'MP'];
        const values = [
            String(playerData.Lv),
            playerData.HP + " / " + playerData.MaxHP,
            playerData.MP + " / " + playerData.MaxMP,
        ];

        for (let i = 0; i < labels.length; i++) {
            const yOffset = i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            const labelObj = messageObject.createTextObject(
                this.scene,
                leftLabelX,
                leftLabelY + yOffset,
                [labels[i]],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            const valueObj = messageObject.createTextObject(
                this.scene,
                rightValueX,
                rightValueY + yOffset,
                [values[i]],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            this.add([labelObj, valueObj]);

            if (labels[i] === 'HP') this.charConditionHP = valueObj;
            if (labels[i] === 'MP') this.charConditionMP = valueObj;
        }

        this.add(charImage).setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());

        this.scene.events.on('UPDATE_CONDITION', this.updateConditionHandler, this);
    }

    private updateConditionHandler(playerData: Phaser.Data.DataManager) {
        if (this.charConditionHP && this.charConditionHP.active) {
            this.charConditionHP.setText([playerData.get('HP') + " / " + playerData.get('MaxHP')]);
        }
        if (this.charConditionMP && this.charConditionMP.active) {
            this.charConditionMP.setText([playerData.get('MP') + " / " + playerData.get('MaxMP')]);
        }
    }

}
