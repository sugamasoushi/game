import { BubbleTalkData } from "@/app/(game)/Data/BubbleTalkData";
import { GameScene, State } from '@/app/(game)/lib/types';
import { Npc } from '../Npc';
import { MessageOperation } from "@/app/(game)/util/MessageOperation";
import { MessageWindow } from '../../../../util/MessageWindow';
import { FieldObjectCheck } from '@/app/(game)/util/FieldObjectCheck';
import { MessageObject } from '../../../../util/MessageObject';

import { GameStateManager } from '@/app/(game)/GameAllState/GameStateManager';

export class BubbleTalk {
    private gameScene: GameScene;
    private npc: Npc | undefined;
    private usePatern: string;
    private fieldObjectCheck: FieldObjectCheck;
    private bubbleTalkKey: string;
    private bubbleTalkData: BubbleTalkData;

    private messageOperation: MessageOperation;
    private messageObjectInstance: MessageObject;

    private textObject: Phaser.GameObjects.Text;
    private messageWindow: Phaser.GameObjects.Graphics;
    private characterNameText: Phaser.GameObjects.Text;
    private characterLabelWindow: Phaser.GameObjects.Graphics;
    private characterIcon: Phaser.GameObjects.Image;
    private clickZone: Phaser.GameObjects.Zone;
    private cropRectMask: Phaser.GameObjects.Graphics;

    private lineSpaceValue: number;
    private textLine: number;//テキスト配列2番目、このテキスト配列番号で改行を行う
    private messageWidth: number;//メッセージの範囲
    private textX: number;//テキスト座標、吹き出しやアイコン等の基準座標
    private textY: number;
    private bubblePosition: string;

    private maxDepthValue: number;

    constructor(gameScene: GameScene, npc: Npc | undefined, bubbleTalkKey: string) {
        this.gameScene = gameScene;
        this.npc = npc;
        this.bubbleTalkKey = bubbleTalkKey;
        this.usePatern = 'BubbleTalk';
        this.maxDepthValue = this.gameScene.getTilemap().getMakeTilemap().heightInPixels > this.gameScene.getTilemap().getMakeTilemap().widthInPixels ? this.gameScene.getTilemap().getMakeTilemap().heightInPixels : this.gameScene.getTilemap().getMakeTilemap().widthInPixels;
        this.maxDepthValue = this.maxDepthValue + 1000
    }

    public init() {
        this.messageObjectInstance = new MessageObject();
        this.messageObjectInstance.init(this.gameScene);
        const textLine = this.messageObjectInstance.getTextInfomation().textLine;
        const lineSpaceValue = this.messageObjectInstance.getTextInfomation().lineSpaceValue;

        this.messageOperation = new MessageOperation(this.gameScene, this.usePatern, textLine, lineSpaceValue);
        this.bubbleTalkData = new BubbleTalkData(this.bubbleTalkKey);
    }

    //会話実行
    public async execTalk(): Promise<void> {

        //状態管理クラス
        const manager = GameStateManager.getInstance();
        //状態更新
        manager.updateState({
            state: State.BUBBLE_TALK
        }, 'BubbleTalk');

        //実行
        await this.talk();
    }

    //キャラクター毎に吹き出しの出現と削除を処理
    public talk() {
        return new Promise<void>(resolve => {
            (async () => {

                //会話データを検索
                const talkdata = this.bubbleTalkData.getBubbleTalkData();

                //配列ごとに台詞を描画
                for (const obj of talkdata!) {
                    const [chara, talks] = Object.entries(obj)[0];
                    await this._execTalk(chara, talks)
                }
                resolve();

                //会話終了後、クリック操作などを再設定
                this.reSetting();
            })();
        })
    }

    //キャラクター毎に吹き出しの出現と削除を行う
    _execTalk(charKey: string, talks: string[]) {
        return new Promise<void>(resolve => {

            //テキストを作成
            this.createTextObject(charKey, talks);

            //吹き出しを作成
            this.createMessageWindow(charKey);

            //マスク作成
            this.createTextMask();

            //キャラクター名ラベルを作成
            this.createCharacterLabel(charKey);

            //キャラクター名ラベルの吹き出しを作成
            this.createCharacterLabelWindow(charKey);

            //キャラクターアイコンを設定
            this.setImage(charKey)

            //オブジェクトの高さを設定
            this.setTextObjectDepth();

            //画面全体にクリックゾーンを作成
            this.createClickZone();

            (async () => {

                //typewWriterアニメーション前にテキストオブジェクトの文字列を空にしておく
                this.textObject.text = '';

                let lineCount = 0;
                for (const text of talks) {
                    lineCount++;
                    await this.messageOperation.typeWriter(this.gameScene, this.textObject, text);
                    await this.messageOperation.textScroll(this.gameScene, this.textObject, this.clickZone, lineCount, talks.length, this.textLine);
                }

                //次のセリフ前にテキストを初期化
                this.messageOperation.deleteMessageObject();
                resolve();
            })();
        })
    }

    //テキストを作成
    private createTextObject(charKey: string, talks: string[]) {

        //テキストオブジェクト作成
        this.textObject = this.messageObjectInstance.createTextObject(this.gameScene, 0, 0, talks);

        //テキストの横幅を設定
        this.messageWidth = this.textObject.width;//メッセージの範囲を更新

        /**
         * 表示位置の設定
         * キャラクターの位置を確認し、吹き出しの位置を設定する。
         */
        let textX: number = 0;
        let textY: number = 0;
        let playerPosition: string = '';
        let npcPosition: string = '';

        //npcが存在する場合
        if (this.npc) {
            this.fieldObjectCheck = new FieldObjectCheck((this.gameScene as GameScene).getPlayer(), this.npc);
            playerPosition = this.fieldObjectCheck.getObjectPosition().object1XPosition;
            npcPosition = this.fieldObjectCheck.getObjectPosition().object2XPosition;
        }

        //プレイヤー発言中の場合
        if (charKey === 'player') {
            if (playerPosition === 'left') {
                textX = (this.gameScene as GameScene).getPlayer().x - this.messageWidth;
            } else {
                textX = (this.gameScene as GameScene).getPlayer().x;
            }
            this.bubblePosition = playerPosition;
            textY = (this.gameScene as GameScene).getPlayer().y - 150;
        } else if (this.npc !== undefined) {
            if (npcPosition === 'left') {
                textX = this.npc!.x - this.messageWidth;
            } else {
                textX = this.npc!.x;
            }
            this.bubblePosition = npcPosition;
            textY = this.npc.y - 150;
        }
        
        //テキストオブジェクトの位置を更新
        this.textObject.x = textX;
        this.textObject.y = textY;

        //テキストオブジェクトの位置を格納
        this.textX = textX;
        this.textY = textY;

        //テキストの縦幅（スクロールに使用）
        this.lineSpaceValue = this.textObject.lineSpacing;

        //表示する行数（今は２行）
        this.textLine = this.textObject.getData('textLine');

        //テキストの位置
        this.textObject.setDepth(Number(this.gameScene.game.config.height));//depthは適当な値、他に配置物を追加する場合は都度調整

        //削除対象に登録
        this.messageOperation.addMessageObjectList(this.textObject);
    }

    //吹き出しを作成
    private createMessageWindow(charKey: string) {

        if (charKey === 'player') {
            const messageWindow = new MessageWindow(this.gameScene);
            messageWindow.init();
            messageWindow.createBubbleWindow(
                this.textObject,
                (this.gameScene as GameScene).getPlayer().getCenter().x,
                (this.gameScene as GameScene).getPlayer().getCenter().y,
                this.bubblePosition,
                undefined);
            this.messageWindow = messageWindow;
        } else if (this.npc !== undefined) {
            const messageWindow = new MessageWindow(this.gameScene);
            messageWindow.init();
            messageWindow.createBubbleWindow(
                this.textObject,
                this.npc!.x,
                this.npc!.y,
                this.bubblePosition,
                undefined);
            this.messageWindow = messageWindow;
        }

        //削除対象に登録
        this.messageOperation.addMessageObjectList(this.messageWindow);
    }

    //メッセージ表示範囲のマスク作成
    private createTextMask() {
        const whiteColor = Phaser.Display.Color.HexStringToColor('#ffffff').color;

        //メッセージ表示範囲のマスク作成
        this.cropRectMask = this.gameScene.add.graphics();
        this.cropRectMask.x = this.textObject.x;//座標初期値を設定
        this.cropRectMask.y = this.textObject.y;
        this.cropRectMask.fillStyle(whiteColor);
        this.cropRectMask.fillRect(0, 0, this.messageWidth, this.textObject.height * this.textLine + this.lineSpaceValue);
        //cropRectMask.fillPath().setDepth(messageObject.depth - 1);//確認用
        this.cropRectMask.setVisible(false);//非表示にする
        this.textObject.setMask(this.cropRectMask.createGeometryMask());

        //削除対象に登録
        this.messageOperation.addMessageObjectList(this.cropRectMask);
    }

    //キャラ名のラベルテキストを作成
    private createCharacterLabel(charKey: string): void {

        //キャラクター名が存在する場合
        if (charKey) {
            //名前データから取得
            const nameData = this.gameScene.cache.json.get('namedata').FieldNameData as Record<string, string>;
            const name = nameData[charKey] ?? '';
            this.characterNameText = this.messageObjectInstance.createTextObject(this.gameScene, 0, 0, name);

            //ラベル位置は調整する事
            const labelX = this.textX;
            const labelY = this.textY - this.characterNameText.getTextMetrics().fontSize * 2;
            this.characterNameText.setPosition(labelX, labelY);
            this.characterNameText.setDepth(this.textObject.depth + 10);

            //削除対象に登録
            this.messageOperation.addMessageObjectList(this.characterNameText);
        }
    }

    //キャラ名のラベルを作成
    private createCharacterLabelWindow(charKey: string) {

        //キャラクター名の確認
        const nameData = this.gameScene.cache.json.get('namedata').FieldNameData as Record<string, string>;
        const name = nameData[charKey];

        //キャラクター名が存在する場合
        if (name) {
            const characterLabelWindow = new MessageWindow(this.gameScene);
            characterLabelWindow.init();
            characterLabelWindow.createOneColumnOneWindow(this.characterNameText, 8);
            this.characterLabelWindow = characterLabelWindow;

            //削除対象に登録
            this.messageOperation.addMessageObjectList(this.characterLabelWindow);
        }
    }

    //キャラクターのアイコンを設定
    private setImage(charKey: string) {

        if (charKey === 'player') {
            this.characterIcon = this.gameScene.add.image(this.textX - 50, this.textY, 'Icon_' + this.gameScene.getPlayer().getData('ImageKey'));

            //削除対象に登録
            this.messageOperation.addMessageObjectList(this.characterIcon);

        } else if (this.npc !== undefined) {
            if (this.npc!.getData('ImageKey')) {
                this.characterIcon = this.gameScene.add.image(this.textX - 50, this.textY, 'Icon_' + this.npc!.getData('ImageKey')!);

                //削除対象に登録
                this.messageOperation.addMessageObjectList(this.characterIcon);
            }
        }
    }

    //オブジェクトの高さを設定
    private setTextObjectDepth() {

        //メッセージウィンドウ
        this.messageWindow.setDepth(this.maxDepthValue - 10);

        //テキストオブジェクト
        this.textObject.setDepth(this.maxDepthValue);

        //キャラ名テキストのウィンドウ
        if (this.characterLabelWindow) {
            this.characterLabelWindow.setDepth(this.maxDepthValue + 10);
        }

        //キャラ名テキスト
        if (this.characterNameText) {
            this.characterNameText.setDepth(this.maxDepthValue + 20);
        }

        //キャラアイコン
        if (this.characterIcon) {
            this.characterIcon.setDepth(this.maxDepthValue + 30);
        }
    }

    //クリックゾーンを作成
    private createClickZone() {

        //マップ全体をクリックゾーンに設定
        this.clickZone = this.gameScene.add.zone(
            this.gameScene.getTilemap().getMakeTilemap().widthInPixels / 2,
            this.gameScene.getTilemap().getMakeTilemap().heightInPixels / 2,
            this.gameScene.getTilemap().getMakeTilemap().widthInPixels,
            this.gameScene.getTilemap().getMakeTilemap().heightInPixels);

        //カーソル設定
        this.clickZone.setInteractive({ useHandCursor: true });

        //削除対象に登録
        this.messageOperation.addMessageObjectList(this.clickZone);
    }

    //再設定
    private reSetting() {

        console.log('reSetting')

        //会話終了後、クリック操作などを再設定
        this.textObject.destroy();
        this.clickZone.destroy();
        this.cropRectMask.destroy();

        //状態管理クラス
        const manager = GameStateManager.getInstance();
        manager.updateState({
            state: State.NOSTATE
        }, 'NoState');

        (this.gameScene as GameScene).input.setDefaultCursor('default');
    }

}
