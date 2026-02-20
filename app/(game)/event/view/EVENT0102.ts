import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { GameScene, EventObjState, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Npc } from "../../gamemain/view/character/Npc";
import { Player } from "../../gamemain/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";

type TalkLine = { [chara: string]: string[] };
type TalkGroup = Record<string, TalkLine[]>;

type TalkData = Record<string, TalkGroup>;

export class EVENT0102 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private playerImage: Phaser.GameObjects.Image;
    private grandpa: Npc;
    private grandpaImage: Phaser.GameObjects.Image;

    eventTalkData: TalkData = {
        //外部化を検討すべき
        eventTalk0102: {
            talk001: [
                { grandpa: ['待て！！\n', '・・・・・・・\n', 'ついに行くのか？\n'] },
                { player: ['う～ん、どうしようかな\n', 'もう行こうかな？\n'] },
                { question: ['はい\n', 'いいえ'] },//選択肢
            ],
            talk002: [
                { grandpa: ['ふふふ、楽しみだぜ・・・\n', 'お前さんの未来が\n'] }
            ],
            talk003: [
                { grandpa: ['そこ危ないから\n', '外回りした方が良い\n', '気を付けるんじゃぞ～\n'] }
            ]
        }
    }

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.gameScene = (this.eventScene.scene.get('Game') as GameScene);
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
        this.settingData.updateEventFlg(this.eventScene, 'EVENT0102', false);

        //プレイヤー設定
        this.player = this.gameScene.getPlayer();
        this.player.state = CharacterState.event;
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.grandpa = (this.characterGameObject.getSprite(this.gameScene, 'grandpa') as Npc);
        this.grandpa.state = CharacterState.event;
        this.grandpa.initMoveToPosition();
        this.grandpa.setMapPosition(this.player.x, 1344);
    }

    //イベント定義
    override async execEvent() {

        //同時処理、全ての処理完了まで待機
        await Promise.all([
            //カメラをプレイヤーの位置まで移動
            new Promise<void>(resolve => {
                const cam = this.gameScene.getMainCamera();
                cam.once(Phaser.Cameras.Scene2D.Events.PAN_COMPLETE, () => { resolve(); }); // PAN_COMPLETE を1回だけ待つ
                cam.pan(this.player.x, this.player.y, 500, 'Linear', false);

                // カメラの内部データを参照する場合
                // this.gameScene.getMainCamera().pan(1504, 320, 500, 'Linear', false, (camera, progress, x, y) => {
                //     if (progress === 1) { resolve(); }
                // });
            }),
            //キャラ移動
            this.characterMovingDOWN(this.grandpa, 1450, 100, true),
            this.player.setStandFrame(this.player.getAnimationKey().standUp),
        ]);

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).player.normal;
        const grandpaImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).grandpa.normal;

        //画像の設定
        // this.playerImage = this.eventScene.add.image(2000, 700, this.player.getData('ImageKey'));
        // this.playerImage.setScale(0.6).setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        // this.grandpaImage = this.eventScene.add.image(-100, 450, this.grandpa.getData('ImageKey'));
        // this.grandpaImage.setScale(0.2).setTint(Phaser.Display.Color.GetColor(128, 128, 128));

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'player', playerImageKey, 1000, 0.6, 200),
            this.characterGameObject.setCharacterImage(this.eventScene, -100, 450, 'grandpa', grandpaImageKey, 200, 0.2, 200),
        ]);

        /*会話---------------------------------------------------------------------------------*/

        //会話開始、テキストの終了をチェックする
        const q: void | number = await this.eventTalk.execTalk(this.eventTalkData['eventTalk0102']?.['talk001'] ?? null, this.characterGameObject);

        //会話分岐
        if (q === 0) {
            await this.eventTalk.execTalk(this.eventTalkData['eventTalk0102']?.['talk002'] ?? null, this.characterGameObject);
        } else {
            await this.eventTalk.execTalk(this.eventTalkData['eventTalk0102']?.['talk003'] ?? null, this.characterGameObject);
        }

        //npcを移動
        await this.characterMovingUP(this.grandpa, 1370, 100, true);
        await this.characterMovingRIGHT(this.grandpa, 470, 100, true);

        /*会話---------------------------------------------------------------------------------*/

        await this.eventEnd();
    }

    //イベント終了処理
    override async eventEnd(): Promise<void> {

        const playerImage = this.characterGameObject.getCharacterImage('player');
        const grandpaImage = this.characterGameObject.getCharacterImage('grandpa');

        await Promise.all([
            this.characterGameObject.scrollOutImage(playerImage, 2000, 200),
            this.characterGameObject.scrollOutImage(grandpaImage, -500, 200)
        ]);

        //以下はイベントごとに設定
        await new Promise<void>(resolve => {

            //プレイヤーの状態を更新
            this.player.state = CharacterState.normal;

            //NPC削除
            this.grandpa.deleteCharacter();

            //設定を戻す
            this.gameScene.events.emit('EVENT_END');

            resolve();
        })

        this.eventScene.scene.stop();
    }
}