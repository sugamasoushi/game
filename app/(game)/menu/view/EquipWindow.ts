import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../MenuTypes";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';

export class EquipWindow extends Phaser.GameObjects.Container {
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;

    constructor(scene: Phaser.Scene, private menuModel: MenuModel) {
        super(scene);
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow) {
        const equipX = 430;
        const equipY = 0;
        const rightValue = 200;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Equip;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const playerData = this.menuModel.getPlayerData();
        const array = [playerData.Weapon, playerData.Armor];

        // 装備リストは2列で表示する
        for (let i = 0; i < array.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const xOffset = col * rightValue;
            const yOffset = row * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            //左　項目
            const Label = messageObject.createTextObject(
                this.scene,
                equipX + xOffset,
                equipY + yOffset,
                ['E'],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            const charEquip = messageObject.createTextObject(
                this.scene,
                equipX + xOffset + 50,
                equipY + yOffset,
                [array[i]],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            this.add([Label, charEquip]);

            // マウスオーバーで選択位置を更新
            charEquip.setInteractive({ useHandCursor: true });
            charEquip.on('pointerover', () => {
                this.selectAllow.updatePosition(charEquip);
            });

            // クリックで装備を変更
            charEquip.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    const debugMessage = new DebugMessage(this.scene);
                    debugMessage.NotImplemented(undefined);
                }
            });
        }

        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.selectAllow.setVisible(false);
        this.add(this.selectAllow);

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
