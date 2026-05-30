import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { FieldScene, EventObjState } from "../../lib/types";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { Npc } from "../../field/view/character/Npc";
import { Player } from "../../field/view/character/Player";
import { CharacterGameObject } from './CharacterGameObject';

export class EVENT010302 extends BaseEvent {
    private fieldScene: FieldScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private lamyNPC: Npc;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.fieldScene = (this.eventScene.scene.get('Field') as FieldScene);
    }

    override init() {
        //会話用クラスのインスタンス生成
        this.settingData = new DataDefinition();
        this.eventTalk = new EventTalk(this.eventScene);
        this.eventTalk.init();

        //キャッシュのイベントフラグを更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010302', false);
        this.switchingEventObjFlg('EVENT010302', false);

        //関連イベントのフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010401', true);
        this.switchingEventObjFlg('EVENT010401', true);

        //プレイヤー設定
        this.player = this.fieldScene.getPlayer();
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.lamyNPC = (this.characterGameObject.getSprite(this.fieldScene, 'lamyNPC') as Npc);
        this.lamyNPC.state = EventObjState.nowEvent;
        this.lamyNPC.initMoveToPosition();
    }

    //イベント定義
    async execEvent() {

        /*会話---------------------------------------------------------------------------------*/

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).meina.normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'meina', playerImageKey, 1000, 0.6, 200),
        ]);

        //会話
        await this.eventTalk.execTalk([
            { meina: ['なんか変わったラミア族だったな。\n'] },
            { meina: ['お腹すいたし、そろそろ帰ろうかな。\n'] }
        ], this.characterGameObject);

        /*会話---------------------------------------------------------------------------------*/

        //イベント終了時の処理
        await this.eventEnd();
    }

    //イベント終了処理
    override async eventEnd(): Promise<void> {

        //以下はイベントごとに設定
        await new Promise<void>(resolve => {
            this.eventScene.cameras.main.once('camerafadeoutcomplete', () => {

                //設定を戻す
                this.fieldScene.events.emit('EVENT_END', true)

                //キャラ画像を削除
                this.characterGameObject.imageObjectsDestroy();

                //マップ移動はシーンの再描画で実施する
                //FieldPresenterに通知
                this.fieldScene.events.emit('FIELD_RESTART', {
                    gameMode: 'FieldMove',
                    x: 816,
                    y: 490,
                    mapKey: '0101',
                    initStandKey: 'stand_up'
                }, 'EventEndRestart');

                resolve();
            });

            this.eventScene.cameras.main.fadeOut(200);
        })
        this.eventScene.scene.stop();
    }
}