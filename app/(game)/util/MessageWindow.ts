import { DataDefinition } from "@/app/(game)/Data/DataDefinition";

export class MessageWindow extends Phaser.GameObjects.Graphics {
    public scene: Phaser.Scene;
    private backColor: number;
    private alphaValue: number;
    private lineColor: number;
    private fontSize: number;
    private rectR = 16;//一旦デフォルトは16
    public width: number = 0;
    public height: number = 0;
    private dataDefinition: DataDefinition;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene = scene;
    }

    public init() {
        //DisplayListに追加
        this.scene.add.existing(this);

        //テキスト設定値取得用
        this.dataDefinition = new DataDefinition();

        const sceneKey = this.scene.scene.key;
        const settingData = this.scene.cache.json.get('savedata').GameSetting.MessageWindow;
        this.backColor = settingData.backColor;
        this.alphaValue = settingData.alphaValue;
        this.lineColor = settingData.lineColor;

        if (sceneKey === 'Event' || sceneKey === 'Battle' || sceneKey === 'Menu') {
            const settingTextData = this.scene.cache.json.get('savedata').GameSetting.EventWindow;
            this.fontSize = settingTextData.fontSize;
        } else {
            //吹き出し会話の場合
            const settingTextData = this.scene.cache.json.get('savedata').GameSetting.BubbleWindow;
            this.fontSize = settingTextData.fontSize;
        }
    }

    //テキストに関係しないウィンドウを作成
    public createMessageWindow(x: number, y: number, w: number, h: number, R: number | undefined, d: number | undefined) {
        const rectR = R ? R : 32;//角の丸みの半径
        const depth = d ? d : 500

        //rectRは指定幅及び指定高さから差し引いて作成する。
        // const width = w + rectR * 2;
        // const height = h + rectR * 2;

        //初期位置を設定
        this.x = x;
        this.y = y;
        this.width = w;
        this.height = h;

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);

        /**
         * 初期位置から更にxy座標分だけずらして描画することになるため注意
         * 以下の処理はx,yを0,0にしてから描画する
         */
        this.strokeRoundedRect(rectR, rectR, w, h, rectR);
        this.fillRoundedRect(rectR, rectR, w, h, rectR);
        this.setDepth(depth);
    }

    //テキストを基準に画面下側にウィンドウを作成
    public createEventMessageWindow(messageObject: Phaser.GameObjects.Text, R?: number) {
        const eventMessageInfomation = this.dataDefinition.getEventMessageInfomation(this.scene);
        const tileSize = 32;//マップのタイルサイズ32を基準とする
        const rectR = R ? R : eventMessageInfomation.fontSize;//角の丸みの半径
        const offset = tileSize * 4;

        //初期位置を設定
        this.x = offset;
        this.y = messageObject.y - tileSize;

        this.width = Number(messageObject.scene.game.canvas.width) - offset * 2;
        this.height = this.scene.game.canvas.height - this.y - tileSize;

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);

        /**
         * 初期位置から更にxy座標分だけずらして描画することになるため注意
         * 以下の処理はx,yを0,0にしてから描画する
         */
        this.strokeRoundedRect(0, 0, this.width, this.height, rectR);
        this.fillRoundedRect(0, 0, this.width, this.height, rectR);
        this.setDepth(messageObject.depth - 10);
    }

    //テキストオブジェクトに対してウィンドウを作成
    public createOneColumnOneWindow(colmun: Phaser.GameObjects.Text, R?: number) {
        const rectR = R ? R : this.rectR;//角の丸みの半径
        const width = colmun.width + rectR * 2;
        const height = colmun.height + rectR * 2;

        this.x = colmun.x;//座標初期値はテキストの左上
        this.y = colmun.y;
        this.width = width;
        this.height = height;

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);
        this.strokeRoundedRect(-1 * rectR, -1 * rectR, width, height, rectR);
        this.fillRoundedRect(-1 * rectR, -1 * rectR, width, height, rectR);
        this.setDepth(colmun.depth - 1);
    }

    //複数テキストに合わせてウィンドウを作成
    public createVerticalColumnWindow(textObjectArray: Phaser.GameObjects.Text[], R: number) {
        let objWidth = 0;
        let objHeight = 0;
        const allowSpace = this.fontSize;//フォントサイズ
        let depthValue = 0;
        textObjectArray.forEach((obj, index) => {
            if (obj.width > objWidth) {
                objWidth = obj.width;
            }
            objHeight += obj.height + (index === 0 ? 0 : obj.lineSpacing);
            depthValue = obj.depth;
        });

        const rectR = R ? R : this.rectR;//角の丸みの半径
        const x = -1 * rectR - allowSpace;
        const y = -1 * rectR;
        const width = objWidth + rectR * 2 + allowSpace;
        const height = objHeight + rectR * 2;

        this.width = width;
        this.height = height;

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);
        this.strokeRoundedRect(x, y, width, height, rectR);
        this.fillRoundedRect(x, y, width, height, rectR);
        this.setDepth(depthValue - 100);
    }

    //吹き出し型のウィンドウを作成
    public createBubbleWindow(textObject: Phaser.GameObjects.Text, pointX: number, pointY: number, direction: string, R?: number | undefined) {

        //テキストの行数、最大２行
        let textLine = 2;

        //改行が存在しない場合
        const hasLineBreak = textObject.text.includes('\n');
        if (!hasLineBreak) {
            textLine = 1;//現状は固定
        }

        const rectR = R ? R : this.rectR;//角の丸みの半径
        const width = textObject.width + rectR * 2;
        let height = textObject.height + rectR * 2;

        //console.log(textObject.style.metrics.fontSize)高さの取得

        if (textLine > 1) {
            height = textObject.style.getTextMetrics().fontSize * textLine + textObject.lineSpacing + rectR * 2;
        } else {
            height = textObject.style.getTextMetrics().fontSize * textLine + rectR * 2;
        }

        this.x = textObject.x;//座標初期値はテキストの左上
        this.y = textObject.y;
        this.width = width;
        this.height = height;

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);
        this.strokeRoundedRect(-1 * rectR, -1 * rectR, width, height, rectR);
        this.fillRoundedRect(-1 * rectR, -1 * rectR, width, height, rectR);
        this.setDepth(textObject.depth - 1);

        //指定位置への吹き出しを作成
        let point1X, point1Y, point2X, point2Y, point3X, point3Y;
        const adjustX = 16;
        const adjustY = 32;

        if (direction === 'right') {
            point1X = Math.floor(width / 7);//左点
            point1Y = height - rectR;
            point2X = Math.floor((width / 7) * 2);//右点
            point2Y = height - rectR;
            point3X = pointX - textObject.x + adjustX;//下点
            point3Y = pointY - textObject.y - adjustY;
        } else if (direction === 'left') {
            point1X = Math.floor(width / 7);//左点
            point1Y = height - rectR;
            point2X = Math.floor((width / 7) * 2);//右点
            point2Y = height - rectR;
            point3X = pointX - textObject.x - adjustX;//下点
            point3Y = pointY - textObject.y - adjustY;
        } else {
            point1X = Math.floor(width / 7);//左点
            point1Y = height - rectR;
            point2X = Math.floor((width / 7) * 2);//右点
            point2Y = height - rectR;
            point3X = pointX - textObject.x;//下点
            point3Y = pointY - textObject.y - adjustY / 2;
        }

        this.fillTriangle(point1X!, point1Y!, point2X!, point2Y!, point3X!, point3Y!);
        this.lineStyle(2, this.lineColor);
        this.lineBetween(point2X!, point2Y!, point3X!, point3Y!);
        this.lineBetween(point1X!, point1Y!, point3X!, point3Y!);

    }

    public setLineLightUp() {
        this.lineStyle(2, this.lineColor);
    }

    public setLineLightDown() {
        this.lineStyle(2, 0x808080);
    }
}
