import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';

export class SkillWindow extends Phaser.GameObjects.Container {
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;

    constructor(scene: Phaser.Scene, private menuModel: MenuModel) {
        super(scene);
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow) {
        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Skill;
        this.y = mainColumn.containtsY;

        const skillX = 430;
        const skillY = 0;
        const rightValue = 200;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const playerData = this.menuModel.getPlayerDataList();
        const array = [playerData.normalSkill, playerData.MagicSkill];

        // スキルリストは2列で表示する
        for (let i = 0; i < array.length; i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const xOffset = col * rightValue;
            const yOffset = row * (this.menuModel.lineSpaceValue + this.menuModel.fontSize);

            //左　項目
            const Label = messageObject.createTextObject(
                this.scene,
                skillX + xOffset,
                skillY + yOffset,
                ['E'],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            const skill = messageObject.createTextObject(
                this.scene,
                skillX + xOffset + 50,
                skillY + yOffset,
                [array[i]],
                this.menuModel.fontSize
            ).setDepth(this.mainWindowDepth + 50);

            this.add([Label, skill]);

            // マウスオーバーで選択位置を更新
            skill.setInteractive({ useHandCursor: true });
            skill.on('pointerover', () => {
                this.selectAllow.updatePosition(skill);
            });

            // クリックでスキルを使用
            skill.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();

                    let text = '';
                    if (array[i] === '殴る') {
                        text = '恐っ！！';
                    } else if (array[i] === '火の玉') {
                        text = 'メラメラ～';
                    }

                    const debugMessage = new DebugMessage(this.scene);
                    debugMessage.NotImplemented(text, 2000);
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
