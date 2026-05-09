import { EventScene } from "../../lib/types";
import { MessageOperation } from "../../util/MessageOperation";
import { MessageWindow } from "../../util/MessageWindow";
import { MessageObject } from "../../util/MessageObject";
import YesNoWindow from "../../util/YesNoWindow";
import { CharacterGameObject } from '../view/CharacterGameObject';
import { SearchCharacterData } from "../../Data/SearchCharacterData";

type TalkLine = { [chara: string]: string[] };

export class EventTalk {
    private eventScene: EventScene;

    private messageOperation: MessageOperation;
    private messageObjectInstance: MessageObject;

    private textObject: Phaser.GameObjects.Text;
    private messageWindow: Phaser.GameObjects.Graphics;
    private characterNameText: Phaser.GameObjects.Text;
    private characterLabelWindow: Phaser.GameObjects.Graphics;
    private clickZone: Phaser.GameObjects.Zone;
    private cropRectMask: Phaser.GameObjects.Graphics;

    private textLine: number;//テキスト配列2番目、このテキスト配列番号で改行を行う
    private textX: number;//テキスト座標、吹き出しやアイコン等の基準座標
    private textY: number;
    private questionNum: number = 0;
    private nowMessageCount = 0;

    private maxDepthValue: number;

    constructor(eventScene: EventScene) {
        this.eventScene = eventScene;
        this.maxDepthValue = 10000;
    }

    public init() {
        this.messageObjectInstance = new MessageObject();
        this.messageObjectInstance.init(this.eventScene);
        const textLine = this.messageObjectInstance.getTextInfomation().textLine;
        const lineSpaceValue = this.messageObjectInstance.getTextInfomation().lineSpaceValue;

        this.messageOperation = new MessageOperation(this.eventScene, 'Event', textLine, lineSpaceValue);
    }

    //会話実行
    public async execTalk(
        talkdata: TalkLine[], characterGameObject: CharacterGameObject, eventImageFlg?: boolean): Promise<void | number> {

        //最終行が選択肢の場合、行番号を取得。※選択肢は必ず会話の最後に設定する事
        for (const data of talkdata) {
            if (Object.keys(data)[0] === 'question') {
                this.questionNum = talkdata.length;
            }
        }

        //実行
        const q = await this.talk(talkdata, characterGameObject, eventImageFlg);

        //メッセ完了後、メッセージウィンドウを削除
        await new Promise<void>(resolve => {
            this.messageWindow.destroy();
            resolve();
        })

        return q;
    }

    //キャラクター毎に吹き出しの出現と削除を処理
    public async talk(talkdata: TalkLine[], characterGameObject: CharacterGameObject, eventImageFlg?: boolean): Promise<void | number> {
        let q: void | number = 99999;

        //配列ごとに台詞を描画
        for (const obj of talkdata!) {
            this.nowMessageCount++;
            const [chara, talks] = Object.entries(obj)[0];

            //選択肢の場合
            if (chara === 'question') {
                const yesNoWindow = new YesNoWindow(this.eventScene, Number(this.eventScene.game.config.width) / 2, Number(this.eventScene.game.config.height) / 2, ['はい', 'いいえ']);
                yesNoWindow.init();
                q = await yesNoWindow.setEvent();

                this.messageOperation.setDeleteMessageFlg(true);
                await this.messageOperation.deleteObject();
                //console.log(q)
                return q;

            } else {
                characterGameObject.lightUp(chara);
                characterGameObject.lightDownOtherCharacters(chara);
            }

            await this.execCharacterMessage(chara, talks, characterGameObject, eventImageFlg)
        }

        //会話終了後、クリック操作などを再設定
        this.reSetting();
    }

    //キャラクター毎に吹き出しの出現と削除を行う
    private async execCharacterMessage(charKey: string, talks: string[], characterGameObject: CharacterGameObject, eventImageFlg?: boolean): Promise<void> {

        //テキストを作成
        this.createMessage(charKey, talks);

        //マスク作成
        this.createTextMask();

        //キャラクター名ラベルを作成
        this.createCharacterLabel(charKey, characterGameObject, eventImageFlg);

        //キャラクター名ラベルの吹き出しを作成
        this.createCharacterLabelWindow(charKey);

        //オブジェクトの高さを設定
        this.setTextObjectDepth();

        //画面全体にクリックゾーンを作成
        this.createClickZone();

        //typewWriterアニメーション前にテキストオブジェクトの文字列を空にしておく
        //this.textObject.text = '';

        let lineCount = 0;
        for (const text of talks) {

            //選択肢の一つ前のメッセージでオブジェクトの削除を停止する。選択肢が無い場合は条件に入らない。
            if (this.nowMessageCount === (this.questionNum - 1)) {
                this.messageOperation.setDeleteMessageFlg(false);
            }

            lineCount++;
            await this.messageOperation.typeWriter(this.eventScene, this.textObject, text);
            await this.messageOperation.textScroll(this.eventScene, this.textObject, this.clickZone, lineCount, talks.length, this.textLine);
        }

        //次のセリフ前にテキストを初期化
        //this.messageOperation.deleteMessageObject();

    }

    //テキストを作成
    private createMessage(charKey: string, talks: string[]) {

        //テキストオブジェクト作成
        this.textObject = this.messageObjectInstance.createTextObject(this.eventScene, 0, 0, talks);

        this.textX = 250;
        this.textY = 550;

        //テキストオブジェクトの位置を更新
        this.textObject.x = this.textX;
        this.textObject.y = this.textY;

        //空のテキストを作成
        //depthは適当な値、他に配置物を追加する場合は都度調整
        // this.textObject.setDepth(this.maxDepthValue);

        //表示する行数（今は２行）
        this.textLine = this.textObject.getData('textLine');

        this.textObject.text = '';//メッセージの幅だけ取得し、空の状態に戻す。改行有テキストも高さ調整するため初期化している。

        //メッセージウィンドウを作成
        if(this.messageWindow){
            this.messageWindow.destroy();
        }
        const messageWindowInstance = new MessageWindow(this.eventScene);
        messageWindowInstance.init();
        messageWindowInstance.createEventMessageWindow(this.textObject);
        this.messageWindow = messageWindowInstance;


        //削除対象に登録
        this.messageOperation.addMessageObjectList(this.textObject);
    }

    //メッセージ表示範囲のマスク作成
    private createTextMask() {
        const whiteColor = Phaser.Display.Color.HexStringToColor('#ffffff').color;

        const width = Number(this.eventScene.game.config.width);
        const height = Number(this.eventScene.game.config.height) - 468;

        //メッセージ表示範囲のマスク作成
        this.cropRectMask = this.eventScene.add.graphics();
        this.cropRectMask.x = 0;//座標初期値を設定
        this.cropRectMask.y = this.textObject.y;
        this.cropRectMask.fillStyle(whiteColor);
        this.cropRectMask.fillRect(0, 0, width, 400);
        //this.cropRectMask.fillPath().setDepth(this.textObject.depth - 1);//確認用
        this.cropRectMask.setVisible(false);//非表示にする
        this.textObject.setMask(this.cropRectMask.createGeometryMask());

        //削除対象に登録
        this.messageOperation.addMessageObjectList(this.cropRectMask);
    }

    //キャラ名のラベルテキストを作成
    private createCharacterLabel(charKey: string, characterGameObject: CharacterGameObject, eventImageFlg?: boolean): void {

        //キャラクター名が存在する場合
        if (charKey) {

            //キャラクターデータから検索クラスを生成
            const searchCharacterData = new SearchCharacterData(this.eventScene.cache.json);
            const name = searchCharacterData.getCharacterData(charKey).name;
            this.characterNameText = this.messageObjectInstance.createTextObject(this.eventScene, 0, 0, name);
            const labelWidth = this.characterNameText.width;

            //ラベル位置を設定
            //イベント画像による会話の場合は中央、それ以外はキャラ画像に合わせて設定
            if (eventImageFlg) {
                const labelX = Number(this.eventScene.game.config.width) / 2 - labelWidth / 2;
                const labelY = this.textY - this.characterNameText.getTextMetrics().fontSize * 2;
                this.characterNameText.setPosition(labelX, labelY);
            } else {

                const characterImage = characterGameObject.getCharacterImage(charKey);
                const labelX = characterImage.x - this.characterNameText.width / 2;
                const labelY = this.textY - this.characterNameText.getTextMetrics().fontSize * 2;
                this.characterNameText.setPosition(labelX, labelY);
            }
            this.characterNameText.setDepth(this.textObject.depth + 10);

            //削除対象に登録
            this.messageOperation.addMessageObjectList(this.characterNameText);
        }
    }

    //キャラ名のラベルを作成
    private createCharacterLabelWindow(charKey: string) {

        //キャラクターデータの確認
        const searchCharacterData = new SearchCharacterData(this.eventScene.cache.json);
        const name = searchCharacterData.getCharacterData(charKey).name;

        //キャラクター名が存在する場合
        if (name) {
            const characterLabelWindow = new MessageWindow(this.eventScene);
            characterLabelWindow.init();
            characterLabelWindow.createOneColumnOneWindow(this.characterNameText, 8);
            this.characterLabelWindow = characterLabelWindow;

            //削除対象に登録
            this.messageOperation.addMessageObjectList(this.characterLabelWindow);
        }
    }

    //オブジェクトの高さを設定
    private setTextObjectDepth() {

        //メッセージウィンドウ
        if (this.messageWindow) {
            this.messageWindow.setDepth(this.maxDepthValue - 10);
        }

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
    }

    //クリックゾーンを作成
    private createClickZone() {

        //マップ全体をクリックゾーンに設定
        this.clickZone = this.eventScene.add.zone(
            Number(this.eventScene.game.config.width) / 2,
            Number(this.eventScene.game.config.height) / 2,
            Number(this.eventScene.game.config.width),
            Number(this.eventScene.game.config.height));

        //カーソル設定
        this.clickZone.setInteractive({ useHandCursor: true });

        //削除対象に登録
        this.messageOperation.addMessageObjectList(this.clickZone);
    }

    public setMessageWindowVisible(flag: boolean) {
        this.messageWindow.setVisible(flag);
    }

    public destroy() {
        if (this.messageOperation) {
            this.messageOperation.destroy();
        }
        if (this.textObject) this.textObject.destroy();
        if (this.clickZone) this.clickZone.destroy();
        if (this.cropRectMask) this.cropRectMask.destroy();
    }

    //再設定
    private reSetting() {
        if (this.messageOperation) {
            this.messageOperation.reSetting();
        }
    }
}
