import { MessageWindow } from '../../util/MessageWindow';
import { MessageObject } from '../../util/MessageObject';
import { Title } from '../../scenes/Title';
import { Sound } from '../../scenes/Sound';
import { SelectAllow } from '../../util/SelectAllow';

export class Omake {
    private omakeGroup: Phaser.GameObjects.Group | null = null;
    private cursorTexts: Phaser.GameObjects.Text[] = [];
    private backButton: Phaser.GameObjects.Text | null = null;
    private backButtonWindow: MessageWindow | null = null;

    private selectedIndex: number = 0;
    private isPlaying: boolean = false;
    private videoArray = ['メイナ', 'ラミィ１', 'ラミィ２', 'イベント01', 'イベント02'];

    private soundScene: Sound;

    public onBack: () => void = () => { };

    constructor(private titleScene: Title) {
        this.soundScene = this.titleScene.scene.get('Sound') as Sound;
    }

    public showOmake() {
        this.selectedIndex = 0;
        this.isPlaying = false;
        const height = Number(this.titleScene.game.config.height);
        const textX = 270;
        const textY = 300;
        const depth = height + 10000;

        const messageObject = new MessageObject();
        messageObject.init(this.titleScene, 'Title');

        const labels: Phaser.GameObjects.Text[] = [];
        this.cursorTexts = [];
        const allObjects: Phaser.GameObjects.GameObject[] = [];
        const columnGap = 320;

        this.videoArray.forEach((title, i) => {
            const column = i % 2;
            const row = Math.floor(i / 2);
            const x = textX + (column * columnGap);
            const y = textY + 125 + (row * 70);

            // カーソル
            const cursor = messageObject.createTextObject(this.titleScene, x - 30, y, ['']);
            cursor.setDepth(depth);
            this.cursorTexts.push(cursor);

            // ラベル
            const label = messageObject.createTextObject(this.titleScene, x, y, [title]);
            label.setDepth(depth);
            labels.push(label);

            label.setInteractive({ useHandCursor: true });
            label.on('pointerover', () => {
                if (!this.isPlaying) {
                    this.selectedIndex = i;
                    this.updateCursor();
                }
            });
            label.on('pointerdown', () => {
                if (!this.isPlaying) {
                    this.selectedIndex = i;
                    this.updateCursor();
                    this.decide();
                }
            });

            allObjects.push(cursor, label);
        });

        const messageWindow = new MessageWindow(this.titleScene);
        messageWindow.init();
        messageWindow.createEventMessageWindow(labels[0]);
        allObjects.push(messageWindow as unknown as Phaser.GameObjects.GameObject);

        this.omakeGroup = this.titleScene.add.group(allObjects);
        this.updateCursor();
        this.backButtonCreate(textX + 780, textY + 90, () => {
            this.hideOmakeMenu();
            this.onBack();
        });
    }

    private updateCursor() {
        this.cursorTexts.forEach((cursor, i) => {
            cursor.setText(i === this.selectedIndex ? '▶' : '');
        });
    }

    public focusNext() {
        if (this.isPlaying) return;
        this.selectedIndex = (this.selectedIndex + 1) % this.videoArray.length;
        this.updateCursor();
    }

    public focusPrev() {
        if (this.isPlaying) return;
        this.selectedIndex = (this.selectedIndex - 1 + this.videoArray.length) % this.videoArray.length;
        this.updateCursor();
    }

    public decide() {
        if (this.isPlaying) return;
        this.playVideo(this.videoArray[this.selectedIndex]);
    }

    private async playVideo(key: string) {
        this.isPlaying = true;
        const gameWidth = this.titleScene.game.config.width as number;
        const gameHeight = this.titleScene.game.config.height as number;
        const depth = gameHeight + 12000;

        const time = 1000;

        //動画ロード
        const loadVideo = (videoKey: string, url: string) => new Promise<void>((resolve) => {
            if (this.titleScene.cache.video.exists(videoKey)) {
                resolve();
                return;
            }

            this.titleScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
                resolve();
            }, this);
            this.titleScene.load.video(videoKey, url);
            this.titleScene.load.start();
        });

        //画像
        const loadImage = (videoKey: string, url: string) => new Promise<void>((resolve) => {
            if (this.titleScene.cache.video.exists(videoKey)) {
                resolve();
                return;
            }

            this.titleScene.load.once(Phaser.Loader.Events.COMPLETE, () => {
                resolve();
            }, this);
            this.titleScene.load.image(videoKey, url);
            this.titleScene.load.start();
        });

        try {
            switch (key) {
                case 'メイナ': {
                    await loadVideo('meina_video', 'video/ComfyUI_00010_.mp4');
                    const video = this.titleScene.add.video(gameWidth / 2, gameHeight / 2, 'meina_video');
                    video.setDepth(depth);
                    video.setScale(0.6);
                    video.play();
                    await new Promise<void>(resolve => {
                        video.once('complete', () => {
                            this.titleScene.time.delayedCall(time, () => {
                                video.destroy();
                                resolve();
                            });
                        });
                    });
                    break;
                }
                case 'ラミィ１': {
                    await loadVideo('lamy1_video', 'video/ComfyUI_00018_.mp4');
                    const video1 = this.titleScene.add.video(gameWidth / 2, gameHeight / 2, 'lamy1_video');
                    video1.setDepth(depth);
                    video1.setScale(0.8);
                    video1.play();
                    await new Promise<void>(resolve => {
                        video1.once('complete', () => {
                            this.titleScene.time.delayedCall(time, () => {
                                video1.destroy();
                                resolve();
                            });
                        });
                    });
                    break;
                }
                case 'ラミィ２': {
                    await loadVideo('lamy2_video', 'video/vidu-video-3213668993097372.mp4');
                    const video2 = this.titleScene.add.video(gameWidth / 2, gameHeight / 2, 'lamy2_video');
                    video2.setDepth(depth);
                    video2.setScale(0.5);
                    video2.play();
                    await new Promise<void>(resolve => {
                        video2.once('complete', () => {
                            this.titleScene.time.delayedCall(time, () => {
                                video2.destroy();
                                resolve();
                            });
                        });
                    });
                    break;
                }
                case 'イベント01': {
                    const key = '20250603';
                    await loadImage(key, 'img/eventpicture/20250603.jpg');
                    const screenX = Number(this.titleScene.game.config.width);
                    const screenY = Number(this.titleScene.game.config.height);
                    const eventImage = this.titleScene.add.image(screenX / 2, screenY / 2, key);
                    eventImage.setDepth(depth).setInteractive({ useHandCursor: true });
                    eventImage.once('pointerdown', () => {
                        eventImage.destroy();
                    });
                    break;
                }
                case 'イベント02': {
                    const eventImage: Phaser.GameObjects.Image[] = [];

                    const key1 = 'EVENT020301_1';
                    const key2 = 'EVENT020301_2';
                    const key3 = 'EVENT020301_3';
                    await loadImage(key1, 'img/eventpicture/EVENT020301_1.png');
                    await loadImage(key2, 'img/eventpicture/EVENT020301_2.png');
                    await loadImage(key3, 'img/eventpicture/EVENT020301_3.png');

                    //位置座標
                    const screenWidth = Number(this.titleScene.game.config.width);
                    const screenHeight = Number(this.titleScene.game.config.height);
                    const offScreenX = -screenWidth;
                    const centerX = screenWidth / 2;
                    const centerY = screenHeight / 2;
                    const distanceX = 632;

                    //イベント画像
                    eventImage.push(this.titleScene.add.image(offScreenX, centerY, 'EVENT020301_1'));
                    eventImage.push(this.titleScene.add.image(offScreenX, centerY, 'EVENT020301_2'));
                    eventImage.push(this.titleScene.add.image(offScreenX, centerY, 'EVENT020301_3'));
                    eventImage.forEach(image => {
                        image.setDepth(depth);
                        image.x = offScreenX;
                    });

                    //左矢印
                    const leftArrow = new SelectAllow(this.titleScene);
                    leftArrow.init(centerX - distanceX, centerY, 'left', true);
                    leftArrow.createAllow();
                    leftArrow.setDepth(depth + 1);
                    leftArrow.setInteractive(new Phaser.Geom.Rectangle(-30, -30, 60, 60), Phaser.Geom.Rectangle.Contains);

                    //右矢印
                    const rightArrow = new SelectAllow(this.titleScene);
                    rightArrow.init(centerX + distanceX, centerY, 'right', true);
                    rightArrow.createAllow();
                    rightArrow.setDepth(depth + 1);
                    rightArrow.setInteractive(new Phaser.Geom.Rectangle(-30, -30, 60, 60), Phaser.Geom.Rectangle.Contains);

                    //現在の画像番号
                    let currentImageIndex = -1;

                    await new Promise<void>(resolve => {
                        const slideImage = (instructions: string) => {

                            //右スライド
                            if (instructions === 'SLIDE_RIGHT') {
                                this.soundScene.playSe('SE_cardTurnOver');

                                //スライド後、最後の画像が完了したら終了
                                if (currentImageIndex + 1 >= eventImage.length) {
                                    eventImage.forEach(img =>{
                                        img.destroy();
                                    })
                                    leftArrow.destroy();
                                    rightArrow.destroy();
                                    resolve();
                                }

                                //次ページを画面にスライド
                                this.titleScene.tweens.add({
                                    targets: eventImage[++currentImageIndex],//番号を更新してスライド
                                    x: centerX,
                                    duration: 500,
                                    ease: 'Power2'
                                });
                            }

                            //左スライド
                            if (instructions === 'SLIDE_LEFT') {
                                if (currentImageIndex - 1 < 0) return;
                                this.soundScene.playSe('SE_cardTurnOver');

                                //現在のページを画面外左にスライド
                                this.titleScene.tweens.add({
                                    targets: eventImage[currentImageIndex--],//スライド後に番号を更新
                                    x: offScreenX,
                                    duration: 500,
                                    ease: 'Power2'
                                });
                            }
                        };

                        //左矢印押下
                        leftArrow.on('pointerdown', () => { slideImage('SLIDE_LEFT'); });

                        //右矢印押下
                        rightArrow.on('pointerdown', () => { slideImage('SLIDE_RIGHT'); });

                        //最初のスライドを実行
                        slideImage('SLIDE_RIGHT');

                    })
                    break;
                }
                default:
                    break;
            }
        } finally {
            this.isPlaying = false;
        }
    }

    public hideOmakeMenu() {
        if (this.omakeGroup) {
            this.omakeGroup.destroy(true);
            this.omakeGroup = null;
        }
        if (this.backButton) {
            this.backButton.destroy();
            this.backButton = null;
        }
        if (this.backButtonWindow) {
            this.backButtonWindow.destroy(true);
            this.backButtonWindow = null;
        }
        this.cursorTexts = [];
    }

    private backButtonCreate(x: number, y: number, backExec: () => void) {
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.titleScene, 'Title');

        this.backButton = messageObjectInstance.createTextObject(this.titleScene, x, y, '✖');
        this.backButton.setDepth(Number(this.titleScene.game.config.height) + 11000);

        this.backButtonWindow = new MessageWindow(this.titleScene);
        this.backButtonWindow.init();
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y;
        this.backButtonWindow.setDepth(this.backButton.depth - 1);

        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            if (!this.isPlaying) {
                backExec();
            }
        }, this);
    }
}
