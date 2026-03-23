import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import { Sound } from "../../scenes/Sound";

export class SaveWindow extends Phaser.GameObjects.Container {
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;
    private soundScene: Sound;

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public create(mainColumn: MainColumnWindow) {
        const saveX = 100;
        const saveY = 0;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Save;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        const array = ['メイナ', 'ラミィ１', 'ラミィ２'];

        for (let i = 0; i < array.length; i++) {

            //左　項目
            const Label = messageObject.createTextObject(
                this.scene, saveX, saveY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize),
                ['MOVIE ' + i], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

            //右　セーブスロット
            const saveSlot = messageObject.createTextObject(
                this.scene, saveX + 150, saveY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize),
                [array[i]], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
            this.add([Label, saveSlot]);

            // マウスオーバーで選択位置を更新
            saveSlot.setInteractive({ useHandCursor: true });
            saveSlot.on('pointerover', () => {
                this.selectAllow.updatePosition(saveSlot);
            });

            // クリックでセーブ
            saveSlot.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.playVideo(array[i]);
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

    private async playVideo(key: string) {
        const gameWidth = this.scene.game.config.width as number;
        const gameHeight = this.scene.game.config.height as number;

        await new Promise<void>(resolve => {
            const time = 1000;
            switch (key) {
                case 'メイナ':
                    this.soundScene.sound.pauseAll();
                    this.scene.events.emit('GAME_INPUT_FALSE');
                    this.selectAllow.setVisible(false);
                    const video = this.scene.add.video(gameWidth / 2, gameHeight / 2, 'meina_video');
                    video.setDepth(this.mainWindowDepth + 50);
                    video.setScale(0.6);
                    video.play();
                    video.once('complete', () => {
                        this.scene.time.delayedCall(time, () => {
                            video.destroy();
                            this.soundScene.sound.resumeAll();
                            this.scene.events.emit('GAME_INPUT_TRUE');
                            this.selectAllow.setVisible(true);
                            resolve();
                        }, [], this.scene);
                    });
                    break;
                case 'ラミィ１':
                    this.soundScene.sound.pauseAll();
                    this.scene.events.emit('GAME_INPUT_FALSE');
                    this.selectAllow.setVisible(false);
                    const video1 = this.scene.add.video(gameWidth / 2, gameHeight / 2, 'lamy1_video');
                    video1.setDepth(this.mainWindowDepth + 50);
                    video1.setScale(0.8);
                    video1.play();
                    video1.once('complete', () => {
                        this.scene.time.delayedCall(time, () => {
                            video1.destroy();
                            this.soundScene.sound.resumeAll();
                            this.scene.events.emit('GAME_INPUT_TRUE');
                            this.selectAllow.setVisible(true);
                            resolve();
                        }, [], this.scene);
                    });
                    break;
                case 'ラミィ２':
                    this.soundScene.sound.pauseAll();
                    this.scene.events.emit('GAME_INPUT_FALSE');
                    this.selectAllow.setVisible(false);
                    const video2 = this.scene.add.video(gameWidth / 2, gameHeight / 2, 'lamy2_video');
                    video2.setDepth(this.mainWindowDepth + 50);
                    video2.setScale(0.5);
                    video2.play();
                    video2.once('complete', () => {
                        this.scene.time.delayedCall(time, () => {
                            video2.destroy();
                            this.soundScene.sound.resumeAll();
                            this.scene.events.emit('GAME_INPUT_TRUE');
                            this.selectAllow.setVisible(true);
                            resolve();
                        }, [], this.scene);
                    });
                    break;
            }

        });
    }
}
