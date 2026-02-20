import { MessageWindow } from './MessageWindow';
import { MessageObject } from './MessageObject';

export default class DebugMessage {
    scene;
    defaultText = ['なんもな～い！ｗ'];

    constructor(scene: Phaser.Scene) {
        this.scene = scene;
    }

    NotImplemented(text: string | undefined) {
        const setText = text ? text : this.defaultText;
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);

        const noGimicText = messageObjectInstance.createTextObject(this.scene, 500, 150, setText);
        const noGimicImage = this.scene.add.image(noGimicText.x - 200, noGimicText.y + 250, '20240907_3');
        const noGimicWindow = new MessageWindow(this.scene);

        noGimicWindow.init();
        noGimicWindow.createBubbleWindow(noGimicText, -50 + 500, 80 + 170, 'right', undefined);

        noGimicText.setDepth(Number(this.scene.game.config.height) + 2);
        noGimicImage.setDepth(Number(this.scene.game.config.height));
        noGimicWindow.setDepth(Number(this.scene.game.config.height) + 1);
        setTimeout(() => {
            noGimicText.destroy();
            noGimicImage.destroy();
            noGimicWindow.destroy();
        }, 4000);
    }
}
