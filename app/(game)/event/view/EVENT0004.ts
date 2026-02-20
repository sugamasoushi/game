import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { GameScene, EventObjState, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Player } from "../../gamemain/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { MessageObject } from "../../util/MessageObject";
import { Sound } from "../../scenes/Sound";

export class EVENT0004 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;

    private soundScene: Sound;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.gameScene = this.eventScene.scene.get('Game') as GameScene;
        this.soundScene = this.eventScene.scene.get('Sound') as Sound;
    }

    override init() {

        //会話用クラスのインスタンス生成
        this.settingData = new DataDefinition();
        this.eventTalk = new EventTalk(this.eventScene);
        this.eventTalk.init();

        //このイベントをOFF
        this.eventObject.state = EventObjState.false;
        (this.eventObject.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える

        //キャッシュのイベントフラグを更新
        this.settingData = new DataDefinition();
        this.settingData.updateEventFlg(this.eventScene, 'EVENT0004', false);

        //プレイヤー設定
        this.player = this.gameScene.getPlayer();
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
    }

    //イベント定義
    async execEvent() {

        //キャラクタースプライトを作成
        const lamy = this.gameScene.getMapObject().createSprite(
            'normal', //npcのタイプ
            '0304', //spriteのタイプ
            this.gameScene,
            816,
            496,
            'lamy', //タイル画像のキー、キャラ名としても使用する
            'lamy', //キャラ番号
            'stand_up',//指定されていなければ下向き配置
            '20240908', //立ち絵のキー、アイコンにも使用
            ''//指定されていれば吹き出し会話を設定する
        );

        lamy!.state = CharacterState.event;
        lamy!.initMoveToPosition();
        lamy!.stopAnimation();

        /*イベント---------------------------------------------------------------------------------*/
        //同時処理、全ての処理完了まで待機
        await Promise.all([
            //カメラ効果
            new Promise<void>(resolve => {
                this.soundScene.SE_karuipunch.play({ loop: false });
                this.gameScene.cameras.main.shake(100, 0.02);
                resolve();
            }),
            //カメラを移動
            new Promise<void>(resolve => {
                const cam = this.gameScene.getMainCamera();
                cam.once(Phaser.Cameras.Scene2D.Events.PAN_COMPLETE, () => { resolve(); }); // PAN_COMPLETE を1回だけ待つ
                cam.pan(816, 448, 500, 'Linear', false);
            }),
            //キャラ移動・配置
            this.player.state = CharacterState.event,
            this.player.setStandFrame(this.player.getAnimationKey().standDown),
            this.characterMovingUP(this.player, 384, 300, false)
        ]);

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).player.normal;
        const lamyImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).lamy.normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'player', playerImageKey, 1000, 0.6, 200),
            this.characterGameObject.setCharacterImage(this.eventScene, -100, 450, 'lamy', lamyImageKey, 200, 1, 200),
        ]);

        await this.eventTalk.execTalk([
            { lamy: ['見つけたぁ！！！\n'] },
            { player: ['痛"っ！\n', 'あ～～～もう！！なんなの！！！\n'] },
            { lamy: ['お前っ！！\n', 'あたしにご飯を作れっ！！\n'] },
            { player: ['・・・・・・・・・・・・・・・・・・・・・・・・・・・・・💢💢💢\n'] },
            { lamy: ['・・・・・・・・・・・・・・・・・・・・・・・・・・・・・・(´;_;｀)\n'] }
        ], this.characterGameObject);

        //立ち絵を非表示
        this.eventScene.add.image(Number(this.eventScene.game.config.width) / 2, Number(this.eventScene.game.config.height) / 2, '20250603');

        await this.eventTalk.execTalk([
            { lamy: ['お願い、あたしが悪かったからご飯恵んでよぉ・・・。\n'] },
            { player: ['（ていうかよく考えたら先に攻撃したの私か）\n', '\n', '分かったよ、何食べる？\n', 'あ、鶏はダメだからね。\n'] }
        ], this.characterGameObject);

        //メッセージウィンドウを非表示
        this.eventTalk.setMessageWindowVisible(false);
        this.eventScene.input.setDefaultCursor('default');

        //------------------------エンディング
        //フェード用
        const maskRect = this.eventScene.add.graphics();
        maskRect.fillStyle(0x000000, 1);
        maskRect.fillRect(0, 0, Number(this.eventScene.game.config.width), Number(this.eventScene.game.config.height));
        maskRect.setDepth(Number(this.eventScene.game.config.height)).setAlpha(0);

        //テキストオブジェクト作成
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.eventScene)
        const messageObject = messageObjectInstance.createTextObject(this.eventScene, 0, 0,
            '謎のラミア娘を倒し、仲間にした（？）メイナ。\n'
            + '彼女はいったい何者なのか、鶏以外を食べるのか！？\n'
            + '\n'
            + '彼女たちの戦いはこれからだ！\n'
        );
        messageObject.setAlpha(0);
        messageObject.setDepth(Number(this.eventScene.game.config.height) + 1);
        messageObject.x = (Number(this.eventScene.game.config.width) - messageObject.width) / 2;
        messageObject.y = (Number(this.eventScene.game.config.height) - messageObject.height) / 2;

        //フェード
        await new Promise<void>(resolve => {
            const fadeout = setInterval(//一定時間毎にメソッドを実行する
                () => {
                    messageObject.alpha += 0.2;
                    maskRect.alpha += 0.1;
                    if (maskRect.alpha >= 0.5) {
                        clearInterval(fadeout);//setInterval()をクリア
                        resolve();
                    }
                }, 50)
        })

        await new Promise<void>(resolve => {
            setTimeout(() => {
                resolve();
            }, 2000);
        })

        //エンディング
        const endMessage = messageObjectInstance.createTextObject(this.eventScene, 0, 0,
            'シナリオ：俺\n'
            + '企画：俺\n'
            + 'プロップデザイン\n'
            + 'キャラクターデザイン：俺\n'
            + 'ストーリー制作：俺\n'
            + 'BGM：「DOVA-SYNDROME」様\n'
            + '効果音：「効果音ラボ」様\n'
            + 'マップチップ：「OpenGameArt.Org」様、「ぴぽや倉庫」様」\n'
            + '編集：俺\n'
            + 'アニメーション制作：俺\n'
            + 'アニメーションプロデューサー：俺\n'
            + 'タイトルロゴデザイン：俺\n'
            + 'マップデザイン：俺\n'
            + 'プログラム：俺\n'
            + '絵コンテ・演出：俺\n'
            + '仕上げ：俺\n'
            + 'ディレクター：俺\n'
            + 'プロデューサー：俺\n'
            + '監督：俺\n'
            + '\n'
            + '\n'
            + 'おしり\n'
        );


        endMessage.setAlign('center');
        endMessage.setDepth(Number(this.eventScene.game.config.height) + 1);
        endMessage.x = (Number(this.eventScene.game.config.width) - endMessage.width) / 2;
        endMessage.y = Number(this.eventScene.game.config.height);

        // 一定時間待機またはクリックで終了
        await new Promise<void>(resolve => {
            const stoptime = setInterval(
                () => {
                    clearInterval(stoptime);//setInterval()をクリア
                    resolve();
                }, 2000)
        })

        // エンドロール
        await new Promise<void>(resolve => {
            const scroll = setInterval(//一定時間毎にメソッドを実行する
                () => {
                    messageObject.y -= 1;//0.5
                    endMessage.y -= 1;//0.5
                    if (endMessage.y < -1 * (endMessage.height)) {
                        clearInterval(scroll);//setInterval()をクリア
                        resolve();
                    }
                }, 10)
        })

        // テキストを全てフェードアウト
        await new Promise<void>(resolve => {
            const fadeout = setInterval(//一定時間毎にメソッドを実行する
                () => {
                    // maskRect.alpha -= 0.1;
                    messageObject.alpha -= 0.2;
                    endMessage.alpha -= 0.2;
                    if (endMessage.alpha <= 0) {
                        clearInterval(fadeout);//setInterval()をクリア
                        messageObject.destroy();
                        // maskRect.destroy();
                        endMessage.destroy();
                        resolve();
                    }
                }, 100)
        })


        //Thank you for playing!!
        const titleText = this.eventScene.add.text(
            Number(this.eventScene.game.config.width) / 2, Number(this.eventScene.game.config.height) / 2 - 200,
            "Thank you\n  for playing!!", { fontFamily: "Arial Black", fontSize: 128, color: "#00a6ed" });
        titleText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true).setAlpha(0);
        titleText.setDepth(Number(this.eventScene.game.config.height) + 10);

        //フェード
        await new Promise<void>(resolve => {
            const fadeout = setInterval(//一定時間毎にメソッドを実行する
                () => {
                    titleText.alpha += 0.1;
                    if (titleText.alpha >= 1) {
                        clearInterval(fadeout);//setInterval()をクリア
                        resolve();
                    }
                }, 100)
        })

        // //会話シーン終了のチェック
        await new Promise<void>(resolve => {
            const backscene = setInterval(//一定時間毎にメソッドを実行する
                () => {
                    const pixelated = this.eventScene.cameras.main.postFX.addPixelate(-1);
                    const endTween = this.eventScene.add.tween({
                        targets: pixelated,
                        duration: 700,
                        amount: 40,
                        onComplete: () => {
                            this.eventScene.cameras.main.fadeOut(100);
                            this.eventScene.scene.moveAbove('Event', 'Title');

                            this.eventScene.scene.start('Title');

                            this.eventScene.scene.stop('Game');
                            this.eventScene.scene.stop('Event');

                            this.eventScene.game.events.emit('BGM_ALL_STOP');

                            clearInterval(backscene);
                            endTween.destroy();
                            resolve();
                        }
                    });
                }, 2000)
        })

        //イベント終了時の処理
        await this.eventEnd();
    }

    override async eventEnd() {
        return new Promise<void>(resolve => {

            //設定を戻す
            this.gameScene.events.emit('EVENT_END')

            resolve();
        })
    }
}