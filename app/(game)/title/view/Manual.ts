import { Title } from '../../scenes/Title';
import { Sound } from '../../scenes/Sound';
import { SelectAllow } from '../../util/SelectAllow';

export class Manual {

    private soundScene: Sound;

    constructor(private titleScene: Title) {
        this.soundScene = this.titleScene.scene.get('Sound') as Sound;
    }

    async onManual(onComplete?: () => void) {
        const gameHeight = this.titleScene.game.config.height as number;
        const depth = gameHeight + 12000;

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

        const eventImage: Phaser.GameObjects.Image[] = [];

        await loadImage('manual1', 'img/manual/manual1.png');
        await loadImage('manual2', 'img/manual/manual2.png');
        await loadImage('manual3', 'img/manual/manual3.png');

        //位置座標
        const screenWidth = Number(this.titleScene.game.config.width);
        const screenHeight = Number(this.titleScene.game.config.height);
        const offScreenX = -screenWidth;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const distanceX = 632;

        //イベント画像
        eventImage.push(this.titleScene.add.image(offScreenX, centerY, 'manual1'));
        eventImage.push(this.titleScene.add.image(offScreenX, centerY, 'manual2'));
        eventImage.push(this.titleScene.add.image(offScreenX, centerY, 'manual3'));
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
                        eventImage.forEach(img => {
                            img.destroy();
                        })
                        leftArrow.destroy();
                        rightArrow.destroy();
                        onComplete?.();
                        resolve();
                    }

                    //１ページ表示以降、現在ページを画面外右へスライド
                    if (currentImageIndex > -1) {
                        this.titleScene.tweens.add({
                            targets: eventImage[currentImageIndex],
                            x: centerX + screenWidth,
                            duration: 500,
                            ease: 'Power2'
                        });
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
                        targets: eventImage[currentImageIndex--],
                        x: offScreenX,
                        duration: 500,
                        ease: 'Power2'
                    });

                    //前のページを画面にスライド
                    this.titleScene.tweens.add({
                        targets: eventImage[currentImageIndex],
                        x: centerX,
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
    }

}
