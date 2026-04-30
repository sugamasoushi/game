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

export class EVENT010301 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private lamyNPC: Npc;

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

        //キャッシュのイベントフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010301', false);
        this.switchingEventObjFlg('EVENT010301', false);

        //関連イベントのフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010302', true);
        this.switchingEventObjFlg('EVENT010302', true);

        //プレイヤー設定
        this.player = this.gameScene.getPlayer();
        this.player.state = CharacterState.event;
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.lamyNPC = (this.characterGameObject.getSprite(this.gameScene, 'lamyNPC') as Npc);
        this.lamyNPC.state = CharacterState.event;
        this.lamyNPC.initMoveToPosition();
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
            this.lamyNPC.setVisible(true),
            this.characterMovingDOWN(this.player, 64, 300, false),
            this.lamyNPC.setStandFrame(this.lamyNPC.getAnimationKey().standDown),
            this.lamyNPC.setMapPosition(this.player.x, 272)
        ]);

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
            { meina: ['痛っ！！\n', '・・・何？\n'] },
            { lamy: ['誰だお前！？\n', 'この家は私が住んでるんだ！！\n', '返さないからな！\n'] },
            { meina: ['ごめんごめん！帰るから！\n'] }
        ], this.characterGameObject);

        //キャラ移動
        await this.characterMovingDOWN(this.player, 32);

        //会話002
        await this.eventTalk.execTalk([
            { lamy: ['ふんっ・・・取り返すこともしないなんて弱っちいの。\n', 'ま、あたしに勝てるわけないしね！\n'] }
        ], this.characterGameObject);

        //キャラ移動
        await this.characterMovingUP(this.player, 32, 300);

        //会話003
        await this.eventTalk.execTalk([
            { meina: ['あ"？\n'] },
            { lamy: ['へぁ？\n'] }
        ], this.characterGameObject);

        //キャラステータス設定
        this.lamyNPC.setData({
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

        this.lamyNPC.setData('name', CaharacterNameData['lamy' as keyof typeof CaharacterNameData])
        //console.log(this.lamy.getData('name'))

        //イベントバトル開始
        this.gameScene.events.emit('BATTLE', { usePatern: 'event', fieldHitEnemy: this.lamyNPC, canNotRunaway: true });

        //戦闘終了後、イベントを途中から開始
        const battleScene = this.eventScene.scene.get('Battle');
        await new Promise<void>(resolve => {
            battleScene.events.on('shutdown', () => {
                this.eventScene.scene.resume();
                resolve();
            });
        })

        // ゲームオーバー時はイベントを中断
        if (this.isGameOver) return;

        //会話
        await this.eventTalk.execTalk([
            { lamy: ['ごめんなさい！！\n', 'ゆるしてぇ！！(´;A;｀)\n'] },
            { meina: ['あ、ごめん。\n', '・・・なんか思ったより弱いけど、ラミア族だよね？\n'] },
            { lamy: ['う、うるさいな・・・。\n', 'あんたが強いだけだ！\n'] }]
            , this.characterGameObject);

        /*会話---------------------------------------------------------------------------------*/

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

                //イベント後のキャラに吹き出し会話を設定
                this.lamyNPC.setBubbleTalkKey('bubbleTalk0001.talk002');
                this.lamyNPC.talkSetting();
                (this.lamyNPC as SpriteType_3x4).setBubble();
                this.lamyNPC.setData('ImageKey', '20240908');
                this.lamyNPC.state = CharacterState.normal;

                //キャラ画像を削除
                this.characterGameObject.imageObjectsDestroy();

                //設定を戻す
                this.gameScene.events.emit('EVENT_END')

                resolve();
            });

            this.eventScene.cameras.main.fadeOut(200);
        })
        this.eventScene.scene.stop();
    }
}