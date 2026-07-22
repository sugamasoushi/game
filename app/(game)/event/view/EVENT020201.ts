import { Event } from "../../scenes/Event";
import { State } from "../../lib/StateTypes";
import { BaseEvent } from "../../core/BaseEvent";
import { FieldScene, CharacterState, BgmState } from "../../lib/types";
import { CharacterGameObject } from './CharacterGameObject';
import { Player } from "../../field/view/character/Player";
import { EventTalk } from "../presenters/EventTalk";
import { SearchCharacterData } from "../../Data/SearchCharacterData";
import { MessageObject } from "../../util/MessageObject";
import { Sound } from "../../scenes/Sound";
import { GameStateManager } from "../../core/GameStateManager";
import { InputManager } from "../../core/input/InputManager";
import { SaveDataManager } from './../../core/SaveDataManager';
import { CacheDataUpdate } from './../../core/CacheDataUpdate';

export class EVENT020201 extends BaseEvent {
    private fieldScene: FieldScene;
    private searchCharacterData: SearchCharacterData;
    private eventTalk: EventTalk;

    private characterGameObject: CharacterGameObject;
    private meina: Player;
    private lamy: Player;

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
        this.updateEventFlg('EVENT020201', false);
        this.switchingEventObjFlg('EVENT020201', false);

        //関連イベントのフラグと当たり判定を更新
        // this.updateEventFlg('EVENT020201', true);
        // this.switchingEventObjFlg('EVENT020201', true);

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
    }

    //イベント定義
    public async execEvent() {

        await this.execFadeOut();
        await new Promise<void>(resolve => {
            this.meina.setPosition(495, 336)
            this.lamy.setPosition(400, 336)
            this.meina.setStandFrame(this.meina.getAnimationKey().standLeft)
            this.lamy.setStandFrame(this.lamy.getAnimationKey().standRight)
            resolve();
        });
        await this.execFadeIn();

        this.fieldScene.cameras.main.pan(this.meina.x - 50, this.meina.y, 500, 'Linear', false)

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
            { lamy: ['お肉もうちょっと食べたかったぁ～\n', 'けど美味しかったぁ～\n'] },
            { meina: ['ラミィはこれからどうするの？\n', '居つくなら・・・\n', '私はもうすぐ出ていくからこの家使っていいよ\n'] },
            { lamy: ['え"え"！？\n', 'それじゃ美味しいご飯食べれないじゃん・・・。\n', '私も付いていく！！\n'] },
            { meina: ['言うと思った\n', '分かった、準備が整ったら一緒に出よう。\n'] },
        ], this.characterGameObject);


        //------------------------エンディング
        //フェード用
        const maskRect = this.eventScene.add.graphics();
        maskRect.fillStyle(0x000000, 1);
        maskRect.fillRect(0, 0, Number(this.eventScene.game.config.width), Number(this.eventScene.game.config.height));
        maskRect.setDepth(Number(this.eventScene.game.config.height)).setAlpha(0);

        //テキストオブジェクト作成
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.eventScene)
        const messageObject = messageObjectInstance.createTextObject(this.eventScene, 0, 0,
            'ラミア娘ことラミィを仲間にしたメイナ。\n'
            + 'ついに冒険に出る事を決意した。\n'
            + '冒険の目的とは？\n'
            + '\n'
            + '彼女たちの旅はこれからだ！\n'
        );
        messageObject.setAlpha(0);
        messageObject.setDepth(Number(this.eventScene.game.config.height) + 1);
        messageObject.x = (Number(this.eventScene.game.config.width) - messageObject.width) / 2;
        messageObject.y = (Number(this.eventScene.game.config.height) - messageObject.height) / 2;

        //フェード
        await Promise.all([
            new Promise<void>(resolve => {
                this.eventScene.tweens.add({
                    targets: maskRect,
                    alpha: 0.5,
                    duration: 1000,
                    ease: 'Power1',
                    onComplete: () => {
                        resolve();
                    }
                });
            }),
            new Promise<void>(resolve => {
                this.eventScene.tweens.add({
                    targets: messageObject,
                    alpha: 1,
                    duration: 1000,
                    ease: 'Power1',
                    onComplete: () => {
                        resolve();
                    }
                });
            }),
        ])

        //一定時間待機
        await new Promise<void>(resolve => {
            this.eventScene.time.delayedCall(2000, () => {
                resolve();
            }, [], this.eventScene);
        })

        //エンディング
        const endMessage = messageObjectInstance.createTextObject(this.eventScene, 0, 0,
            'シナリオ：俺\n'
            + '企画：俺\n'
            + 'プロップデザイン：俺\n'
            + 'キャラクターデザイン：俺\n'
            + 'ストーリー制作：俺\n'
            + 'BGM：「DOVA-SYNDROME」様\n'
            + '効果音：「効果音ラボ」様\n'
            + 'マップチップ：「OpenGameArt.Org」様、「ぴぽや倉庫」様」\n'
            + '編集：俺\n'
            + 'アニメーション制作：俺\n'
            + 'アニメーションプロデューサー：俺\n'
            + 'タイトルロゴデザイン：俺\n'
            + 'マップデザイン：俺\n'
            + 'プログラム：俺\n'
            + '絵コンテ・演出：俺\n'
            + '仕上げ：俺\n'
            + 'ディレクター：俺\n'
            + 'プロデューサー：俺\n'
            + '監督：俺\n'
            + '\n'
            + '\n'
            + 'おしり\n'
            , 24);


        endMessage.setAlign('center');
        endMessage.setDepth(Number(this.eventScene.game.config.height) + 1);
        endMessage.x = (Number(this.eventScene.game.config.width) - endMessage.width) / 2;
        endMessage.y = Number(this.eventScene.game.config.height);

        // 一定時間待機
        await new Promise<void>(resolve => {
            this.eventScene.time.delayedCall(2000, () => {
                resolve();
            }, [], this.eventScene);
        })

        // エンドロール
        await new Promise<void>(resolve => {

            this.eventScene.time.addEvent({
                delay: 10,// 1000ミリ秒（1秒）ごとに実行
                callback: () => {
                    messageObject.y -= 1;
                    endMessage.y -= 1;
                    if (endMessage.y < -1 * (endMessage.height)) {
                        resolve();
                    }
                },
                callbackScope: this,
                loop: true
            });

            //クリックで次のフェードアウトを実行
            this.eventScene.input.once('pointerdown', () => {
                resolve();
            });

            const inputManager = InputManager.getInstance(this.eventScene);
            const sub = inputManager.decideButton$.subscribe(() => {
                resolve();
                sub.unsubscribe();
            });
        })

        // テキストを全てフェードアウト
        await new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: [messageObject, endMessage],
                alpha: 0,
                duration: 500,
                ease: 'Power1',
                onComplete: () => {
                    messageObject.destroy();
                    endMessage.destroy();
                    resolve();
                }
            });
        })

        // 一定時間待機
        await new Promise<void>(resolve => {
            this.eventScene.time.delayedCall(1000, () => {
                resolve();
            }, [], this.eventScene);
        })

        //Thank you for playing!!
        const titleText = this.eventScene.add.text(
            Number(this.eventScene.game.config.width) / 2, Number(this.eventScene.game.config.height) / 2 - 200,
            "Thank you\n  for playing!!", { fontFamily: "Arial Black", fontSize: 128, color: "#00a6ed" });
        titleText.setOrigin(0.5, 0).setStroke('#2d2d2d', 16).setShadow(4, 4, '#000000', 8, false, true).setAlpha(0);
        titleText.setDepth(Number(this.eventScene.game.config.height) + 10);

        //クリア状態に更新
        const gameStateManager = GameStateManager.getInstance();
        gameStateManager.updateState({ gameClearFlg: true }, 'system');

        //キャッシュデータ更新
        const cacheDataUpdate = new CacheDataUpdate(this.eventScene);
        await cacheDataUpdate.phaserCacheDataUpdate();

        //フェード
        await new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: titleText,
                alpha: 1,
                duration: 1000,
                ease: 'Power1',
                onComplete: () => {
                    resolve();
                }
            });
        })

        //セーブ処理
        const saveDataManager = new SaveDataManager();
        await saveDataManager.writeSaveData(this.eventScene);

        // //会話シーン終了のチェック
        await new Promise<void>(resolve => {

            //一定時間「Thank you for playing!!」を表示
            this.eventScene.time.delayedCall(2000, () => {
                const pixelated = this.eventScene.cameras.main.postFX.addPixelate(-1);
                this.eventScene.add.tween({
                    targets: pixelated,
                    duration: 700,
                    amount: 40,
                    onComplete: () => {
                        this.eventScene.cameras.main.once('camerafadeoutcomplete', () => {

                            //リスタート
                            const manager = GameStateManager.getInstance();
                            manager.updateState({ state: State.GAME_RESTART }, 'Event');

                            //現在のBGM状態を更新
                            manager.updateState({ bgmState: BgmState.NOSTATE }, 'sound');

                            //イベント終了時の処理
                            this.eventEnd();

                            resolve();
                        });

                        this.eventScene.cameras.main.fadeOut(200);
                    }
                });
            }, [], this.eventScene);
        })
    }

    override eventEnd() {

        //設定を戻す
        this.fieldScene.events.emit('EVENT_END', true)
    }
}