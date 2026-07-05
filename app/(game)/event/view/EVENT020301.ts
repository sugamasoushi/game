import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { FieldScene, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Player } from "../../field/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { Sound } from "../../scenes/Sound";
import { GameStateManager } from "../../core/GameStateManager";
import { SelectAllow } from "../../util/SelectAllow";

export class EVENT020301 extends BaseEvent {
    private fieldScene: FieldScene;
    private uiScene: Phaser.Scene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private meina: Player;
    private lamy: Player;
    private eventImage: Phaser.GameObjects.Image[] = [];

    private soundScene: Sound;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.fieldScene = this.eventScene.scene.get('Field') as FieldScene;
        this.uiScene = this.eventScene.scene.get('UI');
        this.soundScene = this.eventScene.scene.get('Sound') as Sound;
    }

    override init() {

        //イベント画像のロード
        this.eventScene.load.image('EVENT020301_1', 'assets/img/eventpicture/EVENT020301_1.png');
        this.eventScene.load.image('EVENT020301_2', 'assets/img/eventpicture/EVENT020301_2.png');
        this.eventScene.load.image('EVENT020301_3', 'assets/img/eventpicture/EVENT020301_3.png');
        this.eventScene.load.start();

        //会話用クラスのインスタンス生成
        this.settingData = new DataDefinition();
        this.eventTalk = new EventTalk(this.eventScene);
        this.eventTalk.init();

        //キャッシュのイベントフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT020301', false);
        this.switchingEventObjFlg('EVENT020301', false);

        const gameStateManager = GameStateManager.getInstance();
        const currentPlayerParty = gameStateManager.currentPlayerPartyList;

        //プレイヤー設定
        this.meina = currentPlayerParty[0] as Player;
        this.meina.state = CharacterState.event;
        this.meina.stopAnimation();
        this.lamy = currentPlayerParty[1] as Player;
        this.lamy.state = CharacterState.event;
        this.lamy.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
    }

    //イベント定義
    public async execEvent() {
        console.log("EVENT020301")

        await this.execFadeOut();
        await new Promise<void>(resolve => {
            this.meina.setMapPosition(896, 516)
            this.lamy.setMapPosition(928, 480)
            this.meina.setStandFrame(this.meina.getAnimationKey().standLeft)
            this.lamy.setStandFrame(this.lamy.getAnimationKey().standLeft)
            resolve();
        });
        await this.execFadeIn();

        this.fieldScene.cameras.main.pan(this.meina.x - 50, this.meina.y, 500, 'Linear', false)

        /*会話---------------------------------------------------------------------------------*/

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).meina.normal;
        const lamyImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).lamy.normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'meina', playerImageKey, 1000, 0.6, 200),
            this.characterGameObject.setCharacterImage(this.eventScene, -100, 450, 'lamy', lamyImageKey, 200, 1, 200),
        ]);

        //会話開始、テキストの終了をチェックする
        await this.eventTalk.execTalk([
            { meina: ['ここは一体・・・\n', '今までこんな場所あったっけ？\n'] },
            { lamy: ['なんか怪しい家があるね\n', '食べ物あるかな？\n'] },
            { meina: ['あんたそればっかりね\n', '\n', 'ん？あれは・・・？\n'] },
        ], this.characterGameObject);


        //位置座標
        const screenWidth = Number(this.eventScene.game.config.width);
        const screenHeight = Number(this.eventScene.game.config.height);
        const offScreenX = -screenWidth;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        const distanceX = 632;

        //イベント画像
        this.eventImage.push(this.eventScene.add.image(offScreenX, centerY, 'EVENT020301_1'));
        this.eventImage.push(this.eventScene.add.image(offScreenX, centerY, 'EVENT020301_2'));
        this.eventImage.push(this.eventScene.add.image(offScreenX, centerY, 'EVENT020301_3'));
        this.eventImage.forEach(image => {
            //image.setScale(0.6)
            image.setDepth(200);
            image.x = offScreenX;
        });

        //左矢印
        const leftArrow = new SelectAllow(this.eventScene);
        leftArrow.init(centerX - distanceX, centerY, 'left', true);
        leftArrow.createAllow();
        leftArrow.setDepth(201);
        leftArrow.setInteractive(new Phaser.Geom.Rectangle(-30, -30, 60, 60), Phaser.Geom.Rectangle.Contains);

        //右矢印
        const rightArrow = new SelectAllow(this.eventScene);
        rightArrow.init(centerX + distanceX, centerY, 'right', true);
        rightArrow.createAllow();
        rightArrow.setDepth(201);
        rightArrow.setInteractive(new Phaser.Geom.Rectangle(-30, -30, 60, 60), Phaser.Geom.Rectangle.Contains);

        //現在の画像番号
        let currentImageIndex = -1;

        await new Promise<void>(resolve => {
            const slideImage = (instructions: string) => {

                //右スライド
                if (instructions === 'SLIDE_RIGHT') {
                    this.soundScene.playSe('SE_cardTurnOver');

                    //スライド後、最後の画像が完了したら終了
                    if (currentImageIndex + 1 >= this.eventImage.length) {

                        //仮想コントローラを再表示
                        this.uiScene.scene.setVisible(true);
                        resolve();
                    }

                    //次ページを画面にスライド
                    this.eventScene.tweens.add({
                        targets: this.eventImage[++currentImageIndex],//番号を更新してスライド
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
                    this.eventScene.tweens.add({
                        targets: this.eventImage[currentImageIndex--],//スライド後に番号を更新
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

            //仮想コントローラを非表示
            this.uiScene.scene.setVisible(false);
        })

        //イベント終了時の処理
        await this.eventEnd();
    }

    override async eventEnd() {
        const playerImage = this.characterGameObject.getCharacterImage('meina');
        const lamyImage = this.characterGameObject.getCharacterImage('lamy');

        await Promise.all([
            this.characterGameObject.scrollOutImage(playerImage, 2000, 200),
            this.characterGameObject.scrollOutImage(lamyImage, -500, 200)
        ]);

        await new Promise<void>(resolve => {

            this.eventScene.cameras.main.once('camerafadeoutcomplete', () => {

                //プレイヤーの状態を更新
                this.meina.state = CharacterState.normal;
                this.lamy.state = CharacterState.normal;

                //キャラ画像を削除
                this.characterGameObject.imageObjectsDestroy();

                //設定を戻す
                this.fieldScene.events.emit('EVENT_END')

                //フラグ更新のためマップリスタート
                this.fieldScene.events.emit('FIELD_RESTART', {
                    gameMode: 'updateFlg',
                    x: this.meina.x,
                    y: this.meina.y,
                    mapKey: '0201',
                    initStandKey: 'stand_left'
                }, 'EventEndRestart');

                resolve();
            });

            this.eventScene.cameras.main.fadeOut(200);
        })
        this.eventScene.scene.stop();
    }
}