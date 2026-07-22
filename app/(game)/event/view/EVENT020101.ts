import { Event } from "../../scenes/Event";
import { BaseEvent } from "../../core/BaseEvent";
import { FieldScene, CharacterState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Player } from "../../field/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { SearchCharacterData } from "../../Data/SearchCharacterData";
import { Sound } from "../../scenes/Sound";
import { GameStateManager } from "../../core/GameStateManager";
import { Npc } from "../../field/view/character/Npc";
import { SearchEnemyData } from "../../Data/SearchEnemyData";

export class EVENT020101 extends BaseEvent {
    private fieldScene: FieldScene;
    private searchCharacterData: SearchCharacterData;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private meina: Player;
    private lamy: Player;
    private bossNPC: Npc;

    private soundScene: Sound;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.fieldScene = this.eventScene.scene.get('Field') as FieldScene;
        this.soundScene = this.eventScene.scene.get('Sound') as Sound;
    }

    override init() {
        //会話用クラスのインスタンス生成
        this.searchCharacterData = new SearchCharacterData(this.eventScene.cache.json);
        this.eventTalk = new EventTalk(this.eventScene);
        this.eventTalk.init();

        //キャッシュのイベントフラグと当たり判定を更新
        this.updateEventFlg('EVENT020101', false);
        this.switchingEventObjFlg('EVENT020101', false);

        //関連イベントのフラグと当たり判定を更新
        this.updateEventFlg('EVENT020201', true);
        this.switchingEventObjFlg('EVENT020201', true);

        const gameStateManager = GameStateManager.getInstance();
        const currentPlayerParty = gameStateManager.currentPlayerPartyList;

        //プレイヤー設定
        this.meina = currentPlayerParty[0] as Player;
        this.meina.state = CharacterState.event;
        this.meina.stopAnimation();
        this.lamy = currentPlayerParty[1] as Player;
        this.lamy.state = CharacterState.event;
        this.lamy.stopAnimation();

        //NPC設定
        this.characterGameObject = new CharacterGameObject();
        this.bossNPC = (this.characterGameObject.getSprite(this.fieldScene, 'boss') as Npc);
        this.bossNPC.state = CharacterState.event;
        this.bossNPC.initMoveToPosition();
    }

    //イベント定義
    public async execEvent() {

        await this.execFadeOut();
        await new Promise<void>(resolve => {
            this.meina.setPosition(608, 448)
            this.lamy.setPosition(512, 448)
            this.meina.setStandFrame(this.meina.getStandKey('up'))
            this.lamy.setStandFrame(this.lamy.getStandKey('up'))
            resolve()
        })
        await this.execFadeIn();

        //カメラを移動
        this.fieldScene.getMainCamera().pan(this.meina.x, this.meina.y + 50, 300, 'Linear', false);

        /*会話---------------------------------------------------------------------------------*/

        //キャラの画像キーを取得
        const playerImageKey = this.searchCharacterData.getCharacterData('meina').normal;
        const lamyImageKey = this.searchCharacterData.getCharacterData('lamy').normal;

        //キャラ画像を配置
        await Promise.all([
            this.characterGameObject.setCharacterImage(this.eventScene, 2000, 700, 'meina', playerImageKey, 1000, 0.6, 200),
            this.characterGameObject.setCharacterImage(this.eventScene, -100, 450, 'lamy', lamyImageKey, 200, 1, 200),
        ]);

        //会話開始、テキストの終了をチェックする
        await this.eventTalk.execTalk([
            { meina: ['よ～し、こいつを狩るか\n', '足引っ張らないでよ！\n'] },
            { lamy: ['任せときなって！\n', 'まずあたしが軽くジャブ打ってぇ！\n', 'それからぁ！\n'] }
        ], this.characterGameObject);

        const searchEnemyData = new SearchEnemyData(this.fieldScene.cache.json);
        const bossEnemyData = searchEnemyData.getEnemyData(this.bossNPC.getData('ImageKey'));
        if (bossEnemyData) {
            this.bossNPC.setData({
                level: bossEnemyData.Level,
                HP: bossEnemyData.HP,
                MP: bossEnemyData.MP,
                MaxHP: bossEnemyData.MaxHP,
                MaxMP: bossEnemyData.MaxMP,
                Attack: bossEnemyData.Attack,
                Guard: bossEnemyData.Guard,
                Speed: bossEnemyData.Speed,
                gold: bossEnemyData.gold
            });
            this.bossNPC.setData('name', bossEnemyData.Name);
        }

        //イベントバトル開始
        this.fieldScene.events.emit('BATTLE', { usePatern: 'event', fieldHitEnemy: this.bossNPC, canNotRunaway: true });

        //戦闘終了後、イベントを途中から開始
        const battleScene = this.eventScene.scene.get('Battle');
        await new Promise<void>(resolve => {
            battleScene.events.on('shutdown', () => {
                this.eventScene.scene.resume();
                this.bossNPC.destroy();
                resolve();
            });
        })

        // ゲームオーバー時はイベントを中断
        if (this.isGameOver) return;

        //会話
        await this.eventTalk.execTalk([
            { meina: ['あ、危なかった・・・。\n'] },
            { lamy: ['ら、楽勝だったわぁ・・・。\n'] }
        ], this.characterGameObject);

        this.meina.setStandFrame(this.meina.getStandKey('left'))
        this.lamy.setStandFrame(this.lamy.getStandKey('right'))

        //怒りのジャンプ
        this.eventScene.tweens.add({
            targets: this.meina,
            y: this.meina.y - 32,
            repeat: 2,
            ease: 'sine.inout',
            yoyo: true,
            duration: 100
        });

        await this.eventTalk.execTalk([
            { meina: ['いきなり特攻するな馬鹿！！\n', '熊の肥やしにでもなるつもりだったの！？\n'] },
            { lamy: ['あ、あたし不味いから吐き出されたって！！\n'] },
            { meina: ['そういう話じゃないって！！\n', 'この蛇食わして太らせるべきだったか・・・？\n'] },
            { lamy: ['ちょっと！！そこまで言うな！！\n'] }
        ], this.characterGameObject);

        const meinaImage = this.characterGameObject.getCharacterImage('meina');
        const lamyImage = this.characterGameObject.getCharacterImage('lamy');

        await Promise.all([
            this.characterGameObject.scrollOutImage(meinaImage, 2000, 200),
            this.characterGameObject.scrollOutImage(lamyImage, -500, 200)
        ]);

        await Promise.all([
            new Promise<void>(resolve => {
                this.meina.stopAnimation();
                this.meina.setStandFrame(this.meina.getStandKey('left'));
                resolve();
            }),
            this.stopAnyTime(500),
            this.meina.setAnimDirection(this.meina.getWalkKey('up'))
        ]);

        await Promise.all([
            this.characterGameObject.scrollInImage(meinaImage, 1000, 200),
            this.characterGameObject.scrollInImage(lamyImage, 200, 200)
        ]);
        this.meina.stopAnimation();

        await this.eventTalk.execTalk([
            { meina: ['よし、帰って処理しないとね\n'] },
            { lamy: ['今日はどんな料理！？\n'] },
            { meina: ['干し肉\n'] },
            { lamy: ['なんで！こんなにあるのに！？\n'] },
            { meina: ['もしもの為に備蓄するの\n', '計画的に食べないとすぐ無くなっちゃうじゃない\n'] },
            { lamy: ['ちぇ～っ\n'] }
        ], this.characterGameObject);

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
                this.meina.state = CharacterState.normal;
                this.lamy.state = CharacterState.normal;

                //キャラ画像を削除
                this.characterGameObject.imageObjectsDestroy();

                //設定を戻す
                this.fieldScene.events.emit('EVENT_END')

                //フラグ更新のためマップリスタート
                this.fieldScene.events.emit('FIELD_RESTART', {
                    gameMode: 'updateFlg',
                    x: 816,
                    y: 490,
                    mapKey: '0101',
                    initStandKey: 'up'
                }, 'EventEndRestart');

                resolve();
            });

            this.eventScene.cameras.main.fadeOut(200);
        })
        this.eventScene.scene.stop();
    }
}