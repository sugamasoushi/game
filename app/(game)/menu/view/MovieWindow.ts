/**
 * 現在未使用
 */

import { MenuModel } from "../model/MenuModel";
import { MainColumnWindow } from "./MainColumnWindow";
import { MessageObject } from "../../util/MessageObject";
import { MenuTab } from "../../lib/types";
import { SelectAllow } from "../../util/SelectAllow";
import { Sound } from "../../scenes/Sound";
import { InputManager } from "../../core/input/InputManager";
import { Subscription, throttleTime } from "rxjs";
import { GameSettingData } from "../../Data/GameSettingData";

export class MovieWindow extends Phaser.GameObjects.Container {
    private menuModel: MenuModel;
    private mainWindowDepth: number = 500;
    public selectAllow: SelectAllow;
    private soundScene: Sound;

    private movieLabels: Phaser.GameObjects.Text[] = [];
    private isMovieSelectMode: boolean = false;
    private canDecide: boolean = false;
    private selectedIndex: number = 0;
    private subs = new Subscription();
    private videoArray = ['メイナ', 'ラミィ１', 'ラミィ２'];

    constructor(scene: Phaser.Scene, menuModel: MenuModel) {
        super(scene);
        this.menuModel = menuModel;
        this.scene.add.existing(this);
        this.soundScene = this.scene.scene.get('Sound') as Sound;
    }

    public create(mainColumn: MainColumnWindow) {
        const saveX = 100;
        const saveY = 0;

        this.x = mainColumn.containtsX + mainColumn.scrollValue * MenuTab.Movie;
        this.y = mainColumn.containtsY;

        const messageObject = new MessageObject();
        messageObject.init(this.scene);

        for (let i = 0; i < this.videoArray.length; i++) {

            //左　項目
            const Label = messageObject.createTextObject(
                this.scene, saveX, saveY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize),
                ['MOVIE ' + i], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);

            //右　セーブスロット
            const saveSlot = messageObject.createTextObject(
                this.scene, saveX + 150, saveY + i * (this.menuModel.lineSpaceValue + this.menuModel.fontSize),
                [this.videoArray[i]], this.menuModel.fontSize).setDepth(this.mainWindowDepth + 50);
            this.add([Label, saveSlot]);

            // マウスオーバーで選択位置を更新
            saveSlot.setInteractive({ useHandCursor: true });
            saveSlot.on('pointerover', () => {
                if (this.isMovieSelectMode) {
                    this.selectedIndex = i;
                    this.selectAllow.updatePosition(saveSlot);
                }
            });

            // クリックでセーブ
            saveSlot.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                if (pointer.leftButtonDown()) {
                    pointer.reset();
                    this.selectedIndex = i;
                    this.playVideo(this.videoArray[i]);
                }
            });

            this.movieLabels.push(saveSlot);
        }

        this.selectAllow = new SelectAllow(this.scene);
        this.selectAllow.init(0, 0);
        this.selectAllow.createAllow();
        this.selectAllow.setVisible(false);
        this.add(this.selectAllow);

        this.setDepth(this.mainWindowDepth + 50);
        this.setMask(mainColumn.cropRectMask.createGeometryMask());

        this.setupPadKeyboardInput();
    }

    private setupPadKeyboardInput() {
        const duration = GameSettingData.getInputSettings(this.scene).duration;
        const inputManager = InputManager.getInstance(this.scene);

        const onSelectStart = () => {
            this.isMovieSelectMode = true;
            this.canDecide = false;
            // 1フレーム待ってから決定可能にする
            this.scene.time.delayedCall(10, () => {
                this.canDecide = true;
            });
            this.selectedIndex = 0;
            this.selectAllow.setVisible(true);
            this.selectAllow.updatePosition(this.movieLabels[0]);
        };

        const onSelectEnd = () => {
            this.isMovieSelectMode = false;
            this.selectAllow.setVisible(false);
        };

        this.scene.events.on('MovieSelectModeStart', onSelectStart);
        this.scene.events.on('MovieSelectModeEnd', onSelectEnd);

        this.subs.add(inputManager.downButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isMovieSelectMode) return;
            if (this.selectedIndex + 1 < this.movieLabels.length) {
                this.selectedIndex += 1;
                this.selectAllow.updatePosition(this.movieLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.upButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isMovieSelectMode) return;
            if (this.selectedIndex - 1 >= 0) {
                this.selectedIndex -= 1;
                this.selectAllow.updatePosition(this.movieLabels[this.selectedIndex]);
            }
        }));

        this.subs.add(inputManager.decideButton$.pipe(
            throttleTime(duration)
        ).subscribe(() => {
            if (!this.isMovieSelectMode || !this.canDecide) return;
            this.playVideo(this.videoArray[this.selectedIndex]);
        }));
    }

    public destroy(fromScene?: boolean) {
        this.subs.unsubscribe();
        this.scene.events.off('MovieSelectModeStart');
        this.scene.events.off('MovieSelectModeEnd');
        super.destroy(fromScene);
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
