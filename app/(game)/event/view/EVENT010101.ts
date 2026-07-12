//NewGame選択時のイベント
import { Event } from "../../scenes/Event";
import { MessageObject } from "../../util/MessageObject";
import { FieldScene, State } from "../../lib/types";
import { BaseEvent } from "../../core/BaseEvent";

import { GameStateManager } from "../../core/GameStateManager";
import { InputManager } from "../../core/input/InputManager";
import { Player } from "../../field/view/character/Player";

//Event.tsは未使用
export class EVENT010101 extends BaseEvent {
    private fieldScene: FieldScene;

    constructor(eventScene: Event, eventObject: Phaser.Physics.Arcade.Sprite) {
        super(eventScene, eventObject);
        this.fieldScene = (this.eventScene.scene.get('Field') as FieldScene);
    }

    override init() {

        //キャッシュのイベントフラグと衝突判定を更新
        this.updateEventFlg('EVENT010101', false);
        this.switchingEventObjFlg('EVENT010101', false);

        const gameStateManager = GameStateManager.getInstance();
        (gameStateManager.currentPlayerPartyList[0] as Player).stopAnimation();
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
            + 'ある山奥に一人の魔術師見習いが暮らしていました。\n'
            + '\n'
            + '見習いの名前は「メイナ」\n'
            + '物心付いた頃から家具付きの家に住んでおり、キッチンも寝室も別々でした。\n'
            + '謎の鶏に育てられ、基本的な生活習慣は身についており、最近は魚料理を夢見ています。\n'
            + '山奥ですからね。\n'
            + '\n'
            + 'グローバルスタンダードな言語を習得しているが、読書は苦手。\n'
            + '基礎学力はそこそこ高いが世間知らず。\n'
            + 'この間も食料調達に町へ出かけた際、道中で狩った熊をそのまま売りつけてしまったとか。\n'
            + '\n'
            + '魔術を勉強しており、その習得の速さは鶏もトサカを巻く程。\n'
            + '将来は大魔導士になると先月まで豪語していたが、最近は魔法戦士がかっこいいと思っている。\n'
            + '長続きしないタイプ。\n'
            + '\n'
            + '今日は山を下りて近くを探索するようだ。\n'
            , 24);
        textObject.setDepth(Number(this.eventScene.game.config.height) + 1);

        //配置
        textObject.x = (Number(this.eventScene.game.config.width) - textObject.width) / 2;
        textObject.y = Number(this.eventScene.game.config.height);

        //テキストスクロール
        await new Promise<void>(resolve => {
            let isResolved = false;

            const doResolve = () => {
                if (isResolved) return;
                isResolved = true;
                sub.unsubscribe();
                resolve();
            };

            this.eventScene.tweens.add({
                targets: textObject,
                y: -1 * (textObject.height),
                flipY: true,
                duration: 40000,
                onComplete: () => {
                    doResolve();
                }
            });

            this.eventScene.input.once('pointerdown', doResolve);

            const inputManager = InputManager.getInstance(this.eventScene);
            const sub = inputManager.decideButton$.subscribe(() => {
                doResolve();
            });
        });

        //フェードアウト
        await new Promise<void>(resolve => {
            this.eventScene.tweens.add({
                targets: [maskRect, textObject],
                alpha: 0,
                duration: 800,
                ease: 'Power1',
                onComplete: () => {
                    textObject.destroy();
                    maskRect.destroy();
                    resolve();
                }
            });
        });

        this.eventEnd();
    }

    override async eventEnd(): Promise<void> {

        //状態管理を更新
        const manager = GameStateManager.getInstance();
        manager.updateState({
            state: State.NOSTATE
        }, 'NoState');

        //設定を戻す
        this.fieldScene.events.emit('EVENT_END', true)

        // 再表示する（起こす）
        this.eventScene.scene.get('UI') as Phaser.Scene;
        this.eventScene.scene.wake('UI');
    }
}