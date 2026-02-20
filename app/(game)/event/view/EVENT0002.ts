import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { GameScene, EventObjState, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Npc } from "../../gamemain/view/character/Npc";
import { Player } from "../../gamemain/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { SpriteType_3x4 } from "../../gamemain/view/character/SpriteType_3x4";
import { Sound } from "../../scenes/Sound";
import { CaharacterNameData } from '../../Data/NameData';

export class EVENT0002 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private lamy: Npc;

    private soundScene: Sound;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.gameScene = (this.eventScene.scene.get('Game') as GameScene);
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
        this.settingData.updateEventFlg(this.eventScene, 'EVENT0002', false);
        this.settingData.updateEventFlg(this.eventScene, 'EVENT0003', true);
        this.serchEventObj('EVENT0003', true);

        //プレイヤー設定
        this.player = this.gameScene.getPlayer();
        this.player.state = CharacterState.event;
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.lamy = (this.characterGameObject.getSprite(this.gameScene, 'lamy') as Npc);
        this.lamy.state = CharacterState.event;
        this.lamy.initMoveToPosition();
    }

    //イベント定義
    public async execEvent() {

        //ゲームシーンのスプライトを操作
        //同時処理、全ての処理完了まで待機
        await Promise.all([
            this.soundScene.SE_karuipunch.play({ loop: false }),
            //カメラ効果
            new Promise<void>(resolve => {
                this.gameScene.getMainCamera().shake(100, 0.02);
                resolve();
            }),
            //カメラを移動
            new Promise<void>(resolve => {
                const cam = this.gameScene.getMainCamera();
                cam.once(Phaser.Cameras.Scene2D.Events.PAN_COMPLETE, () => { resolve(); }); // PAN_COMPLETE を1回だけ待つ
                cam.pan(this.player.x, this.player.y, 500, 'Linear', false);
            }),
            //キャラ移動・配置
            this.characterMovingDOWN(this.player, 336, 300, false),
            this.lamy.setStandFrame(this.lamy.getAnimationKey().standDown),
            this.lamy.setMapPosition(this.player.x, 272)
        ]);

        /*会話---------------------------------------------------------------------------------*/

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).player.normal;
        const lamyImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).lamy.normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'player', playerImageKey, 1000, 0.6, 200),
            this.characterGameObject.setCharacterImage(this.eventScene, -100, 450, 'lamy', lamyImageKey, 200, 1, 200),
        ]);

        //会話開始、テキストの終了をチェックする
        await this.eventTalk.execTalk([
            { player: ['痛っ！！\n', '・・・何？\n'] },
            { lamy: ['誰だお前！？\n', 'この家は私が住んでるんだ！！\n', '返さないからな！\n'] },
            { player: ['ごめんごめん！帰るから！\n'] }
        ], this.characterGameObject);

        //キャラ移動
        await this.characterMovingDOWN(this.player, 368, 100, true);

        //会話002
        await this.eventTalk.execTalk([
            { lamy: ['ふんっ・・・取り返すこともしないなんて弱っちいの。\n', 'ま、あたしに勝てるわけないしね！\n'] }
        ], this.characterGameObject);

        //キャラ移動
        await this.characterMovingUP(this.player, 336, 300, true);

        //会話003
        await this.eventTalk.execTalk([
            { player: ['あ"？\n'] },
            { lamy: ['へぁ？\n'] }
        ], this.characterGameObject);

        //キャラステータス設定
        this.lamy.setData({
            level: 1,
            HP: 40,
            MP: 0,
            MaxHP: 40,
            MaxMP: 20,
            Attack: 12,
            Guard: 1,
            Speed: 9,
            gold: 2
        });

        this.lamy.setData('name', CaharacterNameData['lamy' as keyof typeof CaharacterNameData])
        console.log(this.lamy.getData('name'))

        //イベントバトル開始
        this.gameScene.events.emit('BATTLE', { usePatern: 'event', fieldHitEnemy: this.lamy, canNotRunaway: true });

        //戦闘終了後、イベントを途中から開始
        const battleScene = this.eventScene.scene.get('Battle');
        await new Promise<void>(resolve => {
            battleScene.events.on('shutdown', () => {
                this.eventScene.scene.resume();
                resolve();
            });
        })

        //会話
        await this.eventTalk.execTalk([
            { lamy: ['ごめんなさい！！\n', 'ゆるしてぇ！！(´;A;｀)\n'] },
            { player: ['あ、ごめん。\n', '・・・なんか思ったより弱いけど、ラミア族だよね？\n'] },
            { lamy: ['う、うるさいな・・・。\n', 'あんたが強いだけだ！\n'] }]
            , this.characterGameObject);

        /*会話---------------------------------------------------------------------------------*/

        //イベント終了時の処理
        await this.eventEnd();
    }

    override async eventEnd() {

        const playerImage = this.characterGameObject.getCharacterImage('player');
        const lamyImage = this.characterGameObject.getCharacterImage('lamy');

        await Promise.all([
            this.characterGameObject.scrollOutImage(playerImage, 2000, 200),
            this.characterGameObject.scrollOutImage(lamyImage, -500, 200)
        ]);

        await new Promise<void>(resolve => {

            //プレイヤーの状態を更新
            this.player.state = CharacterState.normal;

            //イベント後のキャラに吹き出し会話を設定
            this.lamy.setBubbleTalkKey('bubbleTalk0001.talk002');
            this.lamy.talkSetting();
            (this.lamy as SpriteType_3x4).setBubble();
            this.lamy.state = CharacterState.normal;

            //設定を戻す
            this.gameScene.events.emit('EVENT_END')

            resolve();
        })
        this.eventScene.scene.stop();
    }
}