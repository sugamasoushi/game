import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { GameScene, EventObjState, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Player } from "../../gamemain/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { MessageObject } from "../../util/MessageObject";
import { Sound } from "../../scenes/Sound";
import { Npc } from "../../gamemain/view/character/Npc";
import { GameStateManager } from "../../GameAllState/GameStateManager";

export class EVENT010401 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private lamyNpc: Npc;


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

        //キャッシュのイベントフラグを更新
        this.settingData = new DataDefinition();
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010401', false);
        this.switchingEventObjFlg('EVENT010401', false);

        //関連イベントのフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT020101', true);
        this.switchingEventObjFlg('EVENT020101', true);

        //プレイヤー設定
        this.player = this.gameScene.getPlayer();
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
    }

    //イベント定義
    async execEvent() {

        //キャラクタースプライトを作成
        this.lamyNpc = this.gameScene.getMapObject().createSprite(
            'normal', //npcのタイプ
            '0304', //spriteのタイプ
            this.gameScene,
            816,
            496,
            'tex_lamy', //タイル画像のキー
            'lamyNPC',//キャラ名
            'stand_up',//向き
            '20240908', //立ち絵のキー、アイコンにも使用
            ''//指定されていれば吹き出し会話を設定する
        )!;

        this.lamyNpc.state = CharacterState.event;
        this.lamyNpc.initMoveToPosition();
        this.lamyNpc.stopAnimation();

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
            this.characterMovingUP(this.player, 96, 300, false)
        ]);

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).meina.normal;
        const lamyImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).lamy.normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'meina', playerImageKey, 1000, 0.6, 200),
            this.characterGameObject.setCharacterImage(this.eventScene, -100, 450, 'lamy', lamyImageKey, 200, 1, 200),
            this.player.setStandFrame(this.player.getAnimationKey().standDown)
        ]);

        await this.eventTalk.execTalk([
            { lamyNPC: ['見つけたぁ！！！\n'] },
            { meina: ['痛"っ！\n', 'あ～～～もう！！なんなの！！！\n'] },
            { lamyNPC: ['お前っ！！\n', 'あたしにご飯を作れっ！！\n'] },
            { meina: ['・・・・・・・・・・・・・・・・・・・・・・・・・・・・・💢💢💢\n'] },
            { lamyNPC: ['・・・・・・・・・・・・・・・・・・・・・・・・・・・・・・(´;_;｀)\n'] }
        ], this.characterGameObject);

        //イベントイラストを被せて表示
        const eventImage = this.eventScene.add.image(Number(this.eventScene.game.config.width) / 2, Number(this.eventScene.game.config.height) / 2, '20250603');

        await this.eventTalk.execTalk([
            { lamyNPC: ['お願い、あたしが悪かったからご飯恵んでよぉ・・・。\n'] },
            { meina: ['（ていうかよく考えたら先に攻撃したの私か）\n', '\n', '分かったよ、何食べる？\n', 'あ、鶏はダメだからね。\n'] }
        ], this.characterGameObject);

        //場面転換
        await this.execFadeOut();
        await new Promise<void>(resolve => {
            //イベントイラストを非表示
            eventImage.destroy();

            //キャラ配置
            this.lamyNpc.setMapPosition(495, 337);
            this.lamyNpc.setStandFrame(this.lamyNpc.getAnimationKey().standLeft);
            this.lamyNpc.setAnimDirection('walk_left');

            this.player.setMapPosition(400, 336);
            this.player.setStandFrame(this.player.getAnimationKey().standRight);
            resolve();
        })
        await this.execFadeIn();

        this.gameScene.cameras.main.pan(this.player.x + 100, this.player.y, 500, 'Linear', false);

        await this.eventTalk.execTalk([
            { lamyNPC: ['もぐもぐ、もぐもぐ・・・\n', 'ん～美味しい！\n'] },
            { meina: ['お～い、少しは遠慮したらどうなのよ？\n'] },
            { lamyNPC: ['いやぁこんな美味しいご飯食べたのは生まれて初めてでさぁ！！\n', 'もう美味しくて美味しくて！！\n'] },
            { meina: ['くっ・・・悪い気がしない・・・。\n', 'まあ、あんたの口に合ったなら良かったよ。\n', 'そういえば名前は？\n', 'あたしはメイナ\n'] },
            { lamyNPC: ['名前は無いから好きに呼んで！\n'] },
            { meina: ['ふ～ん、じゃあラミィって呼ぶね。\n'] }
        ], this.characterGameObject);

        //場面転換
        await this.execFadeOut();
        await new Promise<void>(resolve => {
            this.lamyNpc.stopAnimation();
            resolve();
        })
        await this.execFadeIn();

        await this.eventTalk.execTalk([
            { lamy: ['ご馳走様！あ～～～お腹いっぱい！！\n'] },
            { meina: ['私の分まで全部・・・\n'] },
            { lamy: ['いや～なかなか美味しかった～\n', 'また作ってよね！\n'] },
            { meina: ['あんたねぇ・・・食べた分はちゃんと返してもらうからね。\n', '明日デカいのを狩りに行くから付き合ってもらうよ！\n'] },
            { lamy: ['まかしとけって！\n', 'あたしめっちゃ強いから期待しといてよ！！☆彡\n'] },
            { meina: ['（私より弱いくせに・・・なんか不安だ・・・。）\n'] }
        ], this.characterGameObject);

        //画像をスクロールアウト
        const playerImage = this.characterGameObject.getCharacterImage('meina');
        const lamyImage = this.characterGameObject.getCharacterImage('lamy');
        await Promise.all([
            this.characterGameObject.scrollOutImage(playerImage, 2000, 200),
            this.characterGameObject.scrollOutImage(lamyImage, -500, 200)
        ]);


        //~~~~~~~~~~~翌朝のテロップ~~~~~~~~~~~~~~~

        //フェードアウト用に透明度50%の黒塗を作成
        const maskRect = this.eventScene.add.graphics();
        maskRect.fillStyle(0x000000, 1);
        maskRect.fillRect(0, 0, Number(this.eventScene.game.config.width), Number(this.eventScene.game.config.height));
        maskRect.setDepth(Number(this.eventScene.game.config.height));

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.eventScene)
        const textObject = messageObjectInstance.createTextObject(this.eventScene, 0, 0, '━ 翌朝 ━\n', 56);
        textObject.setDepth(Number(this.eventScene.game.config.height) + 1);
        textObject.x = (Number(this.eventScene.game.config.width) - textObject.width) / 2;
        textObject.y = (Number(this.eventScene.game.config.height) - textObject.height) / 2;

        //一定時間待機
        await this.stopAnyTime(1000);

        //フェードアウト
        await new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: [maskRect, textObject],
                alpha: 0,
                duration: 800,
                ease: 'Power1',
                onComplete: () => {
                    textObject.destroy();
                    maskRect.destroy();
                    resolve();
                }
            });
        });
        //~~~~~~~~~~~翌朝のテロップ~~~~~~~~~~~~~~~

        await Promise.all([
            this.characterGameObject.scrollInImage(playerImage, 1000, 200),
            this.characterGameObject.scrollInImage(lamyImage, 200, 200)
        ]);
        await this.eventTalk.execTalk([
            { meina: ['よし、それじゃあ狩に行こうか。\n'] },
            { lamy: ['お～！腕が鳴るね！\n'] }
        ], this.characterGameObject);
        await Promise.all([
            this.characterGameObject.scrollOutImage(playerImage, 2000, 200),
            this.characterGameObject.scrollOutImage(lamyImage, -500, 200)
        ]);

        //メッセージ表示
        await new Promise<void>(resolve => {
            const time = 1500
            this.gameScene.time.delayedCall(time, () => { resolve(); }, [], this.eventScene);
            this.gameScene.events.emit('FREE_MESSAGE_WINDOW', 'ラミィが仲間になった！！', time);
        });

        await Promise.all([
            this.characterGameObject.scrollInImage(playerImage, 1000, 200),
            this.characterGameObject.scrollInImage(lamyImage, 200, 200)
        ]);

        await this.eventTalk.execTalk([
            { meina: ['ラミィと会った場所から更に東に洞窟があるから\n', 'そこでデカいのを狩ろう。\n'] }
        ], this.characterGameObject);

        //セーブデータ更新。２番目の仲間フラグを立てる。
        this.gameScene.cache.json.get('savedata').playerData2.PartyMemberFlg = true;

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
                this.player.state = CharacterState.normal;

                //NPC削除
                this.lamyNpc.deleteCharacter();

                //キャラ画像を削除
                this.characterGameObject.imageObjectsDestroy();

                //設定を戻す
                this.gameScene.events.emit('EVENT_END');

                //状態管理クラス
                const gameStateManager = GameStateManager.getInstance();

                //フラグ更新のためマップリスタート
                this.gameScene.events.emit('FIELD_RESTART', {
                    gameMode: 'updateFlg',
                    x: this.player.x,
                    y: this.player.y,
                    x2: 495,
                    y2: 337,
                    mapKey: gameStateManager.currentFieldData.mapKey,
                    initStandKey: 'stand_down'
                });

                resolve();
            });

            this.eventScene.cameras.main.fadeOut(200);
        })

        this.eventScene.scene.stop();
    }
}