import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";

export class ConditionWindow extends Phaser.GameObjects.Container {

    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    private charConditionHPs: Phaser.GameObjects.Text[] = [];
    private charConditionMPs: Phaser.GameObjects.Text[] = [];

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);

        this.once('destroy', () => {
            this.scene.events.off('UPDATE_CONDITION', this.updateConditionHandler, this);
        });
    }

    public create(mainColumn: MainColumnWindow) {
        const leftLabelX = 350;
        const leftLabelY = 20;
        const rightValueX = leftLabelX + 100;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Condition;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        // パーティメンバー最大3人分を表示
        const partyList = this.menuModel.getPlayerPartyList().slice(0, 3);
        const personHeight = 160;

        for (const [index, sprite] of partyList.entries()) {
            const yBase = leftLabelY + index * personHeight;

            // アイコン画像のマッピング
            const portraitKey = this.getPortraitKey(sprite.name);
            const charImage = this.scene.add.image(150, yBase + 10, portraitKey).setOrigin(0, 0);
            this.add(charImage);

            const playerData = sprite.data.list;
            const labels = ['LV', 'HP', 'MP'];
            const values = [
                String(playerData.Lv),
                playerData.HP + " / " + playerData.MaxHP,
                playerData.MP + " / " + playerData.MaxMP,
            ];

            for (const [i, label] of labels.entries()) {
                const yOffset = i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

                const labelObj = messageObject.createTextObject(
                    this.scene,
                    leftLabelX,
                    yBase + yOffset,
                    [label],
                    this.menuModel.fontSize
                );

                const valueObj = messageObject.createTextObject(
                    this.scene,
                    rightValueX,
                    yBase + yOffset,
                    [values[i]],
                    this.menuModel.fontSize
                );

                this.add([labelObj, valueObj]);

                if (label === 'HP') this.charConditionHPs[index] = valueObj;
                if (label === 'MP') this.charConditionMPs[index] = valueObj;
            }
        }

        this.setMask(mainColumn.cropRectMask.createGeometryMask());
        this.setDepth(this.mainWindowDepth + 50);
        this.scene.events.on('UPDATE_CONDITION', this.updateConditionHandler, this);
    }

    private getPortraitKey(name: string): string {
        const mapping: { [key: string]: string } = {
            'player': 'Icon_20250609',
            'grandpa': 'Icon_20250609',
            'lamy': 'Icon_20240908',
            'player2': 'Icon_20240908'
        };
        return mapping[name] || 'Icon_20250609';
    }

    private updateConditionHandler() {
        // 全パーティメンバーのステータスを再読み込みして更新
        const partyList = this.menuModel.getPlayerPartyList().slice(0, 3);

        for (const [index, sprite] of partyList.entries()) {
            const playerData = sprite.data;
            if (this.charConditionHPs[index] && this.charConditionHPs[index].active) {
                this.charConditionHPs[index].setText([playerData.get('HP') + " / " + playerData.get('MaxHP')]);
            }
            if (this.charConditionMPs[index] && this.charConditionMPs[index].active) {
                this.charConditionMPs[index].setText([playerData.get('MP') + " / " + playerData.get('MaxMP')]);
            }
        }
    }

}
