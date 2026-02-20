export class MessageWindow extends Phaser.GameObjects.Graphics {
    public scene: Phaser.Scene;
    private backColor: number;
    private alphaValue: number;
    private lineColor: number;
    private fontSize: number;
    private rectR = 16;//一旦デフォルトは16

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene = scene;
    }

    public init() {
        //DisplayListに追加
        this.scene.add.existing(this);

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

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);
        this.strokeRoundedRect(rectR, rectR, w, h, rectR);
        this.fillRoundedRect(rectR, rectR, w, h, rectR);
        this.setDepth(depth);
    }

    //テキストオブジェクトに対してウィンドウを作成
    public createOneColumnOneWindow(colmun: Phaser.GameObjects.Text, R: number | undefined) {
        const rectR = R ? R : this.rectR;//角の丸みの半径
        const width = colmun.width + rectR * 2;
        const height = colmun.height + rectR * 2;

        // lebelWindow = this.scene.add.graphics();
        this.x = colmun.x;//座標初期値はテキストの左上
        this.y = colmun.y;
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

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);
        this.strokeRoundedRect(x, y, width, height, rectR);
        this.fillRoundedRect(x, y, width, height, rectR);
        this.setDepth(depthValue - 100);
    }

    //吹き出し型のウィンドウを作成
    public createBubbleWindow(textObject: Phaser.GameObjects.Text, pointX: number, pointY: number, direction: string, R: number | undefined) {

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
