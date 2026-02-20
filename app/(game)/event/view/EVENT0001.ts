//NewGame選択時のイベント
import { Event } from "../../scenes/Event";
import { MessageObject } from "../../util/MessageObject";
import { GameScene, EventObjState, State } from "../../lib/types";
import { BaseEvent } from "../../core/BaseEvent";
import { DataDefinition } from "../../Data/DataDefinition";

import { GameStateManager } from '@/app/(game)/GameAllState/GameStateManager';

//Event.tsは未使用
export class EVENT0001 extends BaseEvent {
    private gameScene: GameScene;
    private settingData: DataDefinition;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.gameScene = (this.eventScene.scene.get('Game') as GameScene);
    }

    override init() {
        //console.log('EVENT0001')

        //このイベントをOFF
        this.eventObject.state = EventObjState.false;
        (this.eventObject.body as Phaser.Physics.Arcade.StaticBody).collisionCategory = 0;//衝突判定のON/OFFを切り替える

        //キャッシュのイベントフラグを更新
        this.settingData = new DataDefinition();
        this.settingData.updateEventFlg(this.eventScene, 'EVENT0001', false);

        this.gameScene.getPlayer().stopAnimation();
    }

    //イベント実行
    override async execEvent() {

        //フェードアウト用に透明度50%の黒塗を作成
        const maskRect = this.eventScene.add.graphics();
        maskRect.fillStyle(0x000000, 1);
        maskRect.fillRect(0, 0, Number(this.eventScene.game.config.width), Number(this.eventScene.game.config.height));
        maskRect.setDepth(Number(this.eventScene.game.config.height)).setAlpha(0.5);


        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.eventScene)

        //テキストオブジェクト作成
        const textObject = messageObjectInstance.createTextObject(this.eventScene, 0, 0,
            '昔々（？）\n'
            + 'ある山奥に一人の少女が暮らしていました。\n'
            + '\n'
            + '彼女の名前は「メイナ」\n'
            + '物心付いた頃から家具付きの家に住んでおり、キッチンも寝室も別々でした。\n'
            + '謎の鶏に育てられ、基本的な生活習慣は身についており、最近は魚料理を夢見ています。\n'
            + '山奥ですからね。\n'
            + '\n'
            + '語学力はグローバルスタンダードな言語を習得しているが、読書は苦手。\n'
            + '基礎学力はそこそこ高いが世間知らず。\n'
            + 'この間も食料調達に町へ出かけた際、道中で狩った熊をそのまま売りつけてしまったとか。\n'
            + '\n'
            + '魔術を勉強しており、その習得の速さは鶏もトサカを巻く程。\n'
            + '将来は大魔導士になると先月まで豪語していたが、最近は魔法戦士がかっこいいと思っている。\n'
            + '長続きしないタイプ。\n'
            + '\n'
            + '彼女の今日の物語はどんなものだろうか。\n'
        );
        textObject.setDepth(Number(this.eventScene.game.config.height) + 1);

        //メッセージウィンドウ作成
        textObject.x = (Number(this.eventScene.game.config.width) - textObject.width) / 2;
        textObject.y = Number(this.eventScene.game.config.height);

        //テキストスクロール
        await new Promise<void>(resolve => {
            const textScroll = this.eventScene.tweens.add({
                targets: textObject,
                y: -1 * (textObject.height),
                flipY: true,
                duration: 40000,
                onComplete: () => {
                    resolve();
                }
            });

            this.eventScene.input.once('pointerdown', () => {
                textScroll.pause();
                resolve();
            });
        })

        //フェードアウト
        await new Promise<void>(resolve => {
            const fadeout = setInterval(//一定時間毎にメソッドを実行する
                () => {
                    maskRect.alpha -= 0.1;
                    textObject.alpha -= 0.2;
                    if (maskRect.alpha <= 0) {
                        clearInterval(fadeout);//setInterval()をクリア
                        textObject.destroy();
                        maskRect.destroy();
                        resolve();
                    }
                }, 100)
        })

        this.eventEnd();
    }

    override async eventEnd(): Promise<void> {

        //状態管理を更新
        const manager = GameStateManager.getInstance();
        manager.updateState({
            state: State.NOSTATE
        }, 'NoState');

        //設定を戻す
        this.gameScene.events.emit('EVENT_END', true)
    }
}