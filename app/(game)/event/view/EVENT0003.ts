import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { GameScene, EventObjState } from "../../lib/types";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { Npc } from "../../gamemain/view/character/Npc";
import { Player } from "../../gamemain/view/character/Player";
import { CharacterGameObject } from './CharacterGameObject';

export class EVENT0003 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private lamy: Npc;

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
        this.settingData.updateEventFlg(this.eventScene, 'EVENT0003', false);
        this.settingData.updateEventFlg(this.eventScene, 'EVENT0004', true);
        this.serchEventObj('EVENT0004', true);

        //プレイヤー設定
        this.player = this.gameScene.getPlayer();
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.lamy = (this.characterGameObject.getSprite(this.gameScene, 'lamy') as Npc);
        this.lamy.state = EventObjState.nowEvent;
        this.lamy.initMoveToPosition();
    }

    //イベント定義
    async execEvent() {

        /*会話---------------------------------------------------------------------------------*/

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).player.normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'player', playerImageKey, 1000, 0.6, 200),
        ]);

        //会話
        await this.eventTalk.execTalk([
            { player: ['なんか変わったラミア族だったな。\n'] },
            { player: ['お腹すいたし、そろそろ帰ろうかな。\n'] }
        ], this.characterGameObject);

        /*会話---------------------------------------------------------------------------------*/

        //イベント終了時の処理
        await this.eventEnd();
    }

    //イベント終了処理
    override async eventEnd(): Promise<void> {

        //以下はイベントごとに設定
        await new Promise<void>(resolve => {

            //設定を戻す
            this.gameScene.events.emit('EVENT_END', true)

            //マップ移動はシーンの再描画で実施する
            //FieldPresenterに通知
            this.gameScene.events.emit('FIELD_RESTART', {
                gameMode: 'FieldMove',
                x: 816,
                y: 490,
                mapKey: '0101',
                initStandKey: 'stand_up'
            });

            resolve();
        })
        this.eventScene.scene.stop();
    }
}