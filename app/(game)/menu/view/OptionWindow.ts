import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../MenuTypes";
import { SelectAllow } from "../../util/SelectAllow";
import DebugMessage from '../../util/DebugMessage';

export class OptionWindow extends Phaser.GameObjects.Container {

    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public selectAllow: SelectAllow;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
    }

    public create(mainColumn: MainColumnWindow) {
        const optionX = 100;
        const optionY = 0;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Option;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const array = ['テキストスピード', 'ゲーム終了'];

        for (let i = 0; i < array.length; i++) {
            const Label = messageObject.createTextObject(this.scene, optionX, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['　'], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

            const option = messageObject.createTextObject(this.scene, optionX + 10, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                array[i]
            ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
            this.add([Label, option]).setDepth(this.mainWindowDepth + 50);

            option.setInteractive({ useHandCursor: true });
            option.on('pointerover', () => {
                this.selectAllow.updatePosition(option);
            });
            option.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
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

        this.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
