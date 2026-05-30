import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { FieldScene, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Npc } from "../../field/view/character/Npc";
import { Player } from "../../field/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { SpriteType_3x4 } from "../../field/view/character/SpriteType_3x4";
import { Sound } from "../../scenes/Sound";
import { InputManager } from "../../core/input/InputManager";
import { SearchEnemyData } from "../../Data/SearchEnemyData";

export class EVENT010301 extends BaseEvent {
    private fieldScene: FieldScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private lamyNPC: Npc;

    private soundScene: Sound;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.fieldScene = (this.eventScene.scene.get('Field') as FieldScene);
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
        this.player = this.fieldScene.getPlayer();
        this.player.state = CharacterState.event;
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.lamyNPC = (this.characterGameObject.getSprite(this.fieldScene, 'lamyNPC') as Npc);
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
                this.fieldScene.getMainCamera().shake(100, 0.02);
                resolve();
            }),
            //カメラを移動
            new Promise<void>(resolve => {
                const cam = this.fieldScene.getMainCamera();
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

        //キャラステータス設定（imageKeyに対応するenemydataを適用）
        const searchEnemyData = new SearchEnemyData(this.fieldScene.cache.json);
        const lamyEnemyData = searchEnemyData.getEnemyData(this.lamyNPC.getData('ImageKey'));
        if (lamyEnemyData) {
            this.lamyNPC.setData({
                level: lamyEnemyData.level,
                HP: lamyEnemyData.HP,
                MP: lamyEnemyData.MP,
                MaxHP: lamyEnemyData.MaxHP,
                MaxMP: lamyEnemyData.MaxMP,
                Attack: lamyEnemyData.Attack,
                Guard: lamyEnemyData.Guard,
                Speed: lamyEnemyData.Speed,
                gold: lamyEnemyData.gold
            });
            this.lamyNPC.setData('name', lamyEnemyData.name);
        }

        //イベントバトル開始
        this.fieldScene.events.emit('BATTLE', { usePatern: 'event', fieldHitEnemy: this.lamyNPC, canNotRunaway: true });

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
            { lamy: ['ごめんなさい！！\n', 'ゆるしてぇ！！泣\n'] },
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
                this.lamyNPC.setInputManager(InputManager.getInstance(this.fieldScene));
                (this.lamyNPC as SpriteType_3x4).setBubble();
                this.lamyNPC.setData('ImageKey', '20240908');
                this.lamyNPC.state = CharacterState.normal;

                //キャラ画像を削除
                this.characterGameObject.imageObjectsDestroy();

                //設定を戻す
                this.fieldScene.events.emit('EVENT_END')

                resolve();
            });

            this.eventScene.cameras.main.fadeOut(200);
        })
        this.eventScene.scene.stop();
    }

    override destroy() {
        if (this.eventTalk) {
            this.eventTalk.destroy();
        }
    }
}