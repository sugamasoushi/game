import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { FieldScene, EventObjState, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Npc } from "../../field/view/character/Npc";
import { Player } from "../../field/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { GameStateManager } from "../../core/GameStateManager";

type TalkLine = { [chara: string]: string[] };
type TalkGroup = Record<string, TalkLine[]>;

type TalkData = Record<string, TalkGroup>;

export class EVENT010201 extends BaseEvent {
    private fieldScene: FieldScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private grandpa: Npc;

    eventTalkData: TalkData = {
        //外部化を検討すべき
        eventTalk0102: {
            talk001: [
                { grandpa: ['待て！！\n', '・・・・・・・\n', 'ついに行くのか？\n'] },
                { meina: ['う～ん、どうしようかな\n', 'もう行こうかな？\n'] },
                { question: ['はい\n', 'いいえ'] },//選択肢
            ],
            //はいを選んだ場合
            talk002: [
                { grandpa: ['ここ最近ラミア族が増えている\n', '見たら逃げるんじゃよ\n'] }
            ],
            //いいえを選んだ場合
            talk003: [
                { grandpa: ['あまり遠くに行きすぎんようにな\n', 'そうそう、最近ラミア族が増えている\n', '絶対逃げるんじゃよ\n'] }
            ]
        }
    }

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.fieldScene = (this.eventScene.scene.get('Field') as FieldScene);
    }

    override init() {
        //会話用クラスのインスタンス生成
        this.settingData = new DataDefinition();
        this.eventTalk = new EventTalk(this.eventScene);
        this.eventTalk.init();

        //キャッシュのイベントフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010201', false);
        this.switchingEventObjFlg('EVENT010201', false);

        //関連イベントのフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010202', false);
        this.switchingEventObjFlg('EVENT010202', false);

        //プレイヤー設定
        const gameStateManager = GameStateManager.getInstance();
        this.player = gameStateManager.currentPlayerPartyList[0] as Player;
        this.player.state = CharacterState.event;
        this.player.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.grandpa = (this.characterGameObject.getSprite(this.fieldScene, 'grandpa') as Npc);
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
                const cam = this.fieldScene.getMainCamera();
                cam.once(Phaser.Cameras.Scene2D.Events.PAN_COMPLETE, () => { resolve(); }); // PAN_COMPLETE を1回だけ待つ
                cam.pan(this.player.x, this.player.y, 500, 'Linear', false);

                // カメラの内部データを参照する場合
                // this.gameScene.getMainCamera().pan(1504, 320, 500, 'Linear', false, (camera, progress, x, y) => {
                //     if (progress === 1) { resolve(); }
                // });
            }),
            //キャラ移動
            this.grandpa.setVisible(true),
            //this.characterMovingDOWN(this.grandpa, 1450, 100, true),
            this.characterMoving(this.grandpa, this.player.x, 1450, 'walk_down'),
            this.player.setStandFrame(this.player.getAnimationKey().standUp),
        ]);

        //キャラの画像キーを取得
        const playerImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).meina.normal;
        const grandpaImageKey = this.settingData.getImageKeyDataInfomation(this.eventScene).grandpa.normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'meina', playerImageKey, 1000, 0.6, 200),
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
        await this.characterMovingUP(this.grandpa, 100);
        this.characterMovingRIGHT(this.grandpa, 1000);

        await this.stopAnyTime(200);

        /*会話---------------------------------------------------------------------------------*/

        await this.eventEnd();
    }

    //イベント終了処理
    override async eventEnd(): Promise<void> {

        const playerImage = this.characterGameObject.getCharacterImage('meina');
        const grandpaImage = this.characterGameObject.getCharacterImage('grandpa');

        await Promise.all([
            this.characterGameObject.scrollOutImage(playerImage, 2000, 200),
            this.characterGameObject.scrollOutImage(grandpaImage, -500, 200)
        ]);

        //以下はイベントごとに設定
        await new Promise<void>(resolve => {

            this.eventScene.cameras.main.once('camerafadeoutcomplete', () => {

                //プレイヤーの状態を更新
                this.player.state = CharacterState.normal;

                //NPC削除
                this.grandpa.deleteCharacter();

                //キャラ画像を削除
                this.characterGameObject.imageObjectsDestroy();

                //設定を戻す
                this.fieldScene.events.emit('EVENT_END');

                //フラグ更新のためマップリスタート
                this.fieldScene.events.emit('FIELD_RESTART', {
                    gameMode: 'updateFlg',
                    x: this.player.x,
                    y: this.player.y,
                    mapKey: '0102',
                    initStandKey: 'stand_down'
                }, 'EventEndRestart');

                resolve();
            });

            this.eventScene.cameras.main.fadeOut(200);
        })

        this.eventScene.scene.stop();
    }
}