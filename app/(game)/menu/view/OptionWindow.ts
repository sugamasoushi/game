import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";

export class OptionWindow {

    private scene: Phaser.Scene;
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;

    public container: Phaser.GameObjects.Container;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        this.scene = scene;
        this.menuModel = menuModel;
    }

    public create(mainColumn: MainColumnWindow) {
        const optionX = 100;
        const optionY = 0;

        this.container = this.scene.add.container(mainColumn.containtsX + mainColumn.scrollValue * 6, mainColumn.containtsY);

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const array = ['テキストスピード', 'ゲーム終了'];

        for (let i = 0; i < array.length; i++) {
            const Label = messageObject.createTextObject(this.scene, optionX, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), ['　'], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

            const option = messageObject.createTextObject(this.scene, optionX + 10, optionY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize), [
                array[i]
            ], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
            this.container.add([Label, option]).setDepth(this.mainWindowDepth + 50);
        }

        this.container.setMask(mainColumn.cropRectMask.createGeometryMask());
    }
}
