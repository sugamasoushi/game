import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { GameScene, EventObjState, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Player } from "../../gamemain/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { DataDefinition } from "../../Data/DataDefinition";
import { SearchCharacterData } from "../../Data/SearchCharacterData";

export class EVENT010202 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private player: Player;
    private searchCharacterData: SearchCharacterData;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.gameScene = (this.eventScene.scene.get('Game') as GameScene);
    }

    override init() {
        //会話用クラスのインスタンス生成
        this.settingData = new DataDefinition();
        this.eventTalk = new EventTalk(this.eventScene);
        this.eventTalk.init();

        //キャッシュのイベントフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010202', false);
        this.switchingEventObjFlg('EVENT010202', false);

        //関連イベントのフラグと当たり判定を更新
        this.settingData.updateEventFlg(this.eventScene, 'EVENT010201', false);
        this.switchingEventObjFlg('EVENT010201', false);

        //プレイヤー設定
        this.player = this.gameScene.getPlayer();
        this.player.state = CharacterState.event;
        this.player.stopAnimation();

        //画像キーデータ取得
        this.searchCharacterData = new SearchCharacterData(this.eventScene.cache.json);
    }

    //イベント定義
    override async execEvent() {

        //キャラの画像キーを取得
        const playerImageKey = this.searchCharacterData.getCharacterData('meina').normal;

        //キャラ画像を配置
        this.characterGameObject = new CharacterGameObject();
        this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'meina', playerImageKey, 1000, 0.6, 200)

        /*会話---------------------------------------------------------------------------------*/

        await this.eventTalk.execTalk([
            { meina: ['ちょっと山を下りて散策しようかな\n', 'そういえば最近ラミア族が多いんだよね\n'] },
            { meina: ['まだ勝てなそうだから気を付けよう・・・。\n'] }

        ], this.characterGameObject);

        await this.stopAnyTime(50);

        await this.eventEnd();
    }

    //イベント終了処理
    override async eventEnd(): Promise<void> {

        const playerImage = this.characterGameObject.getCharacterImage('meina');
        this.characterGameObject.scrollOutImage(playerImage, 2000, 200)

        //以下はイベントごとに設定
        await new Promise<void>(resolve => {

            //プレイヤーの状態を更新
            this.player.state = CharacterState.normal;

            //キャラ画像を削除
            this.characterGameObject.imageObjectsDestroy();

            //設定を戻す
            this.gameScene.events.emit('EVENT_END');

            //フラグ更新のためマップリスタート
            this.gameScene.events.emit('FIELD_RESTART', {
                gameMode: 'updateFlg',
                x: this.player.x,
                y: this.player.y,
                mapKey: '0102',
                initStandKey: 'stand_down'
            });

            resolve();
        })

        this.eventScene.scene.stop();
    }
}