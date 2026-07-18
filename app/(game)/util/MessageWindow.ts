import { GameSettingData } from "@/app/(game)/Data/GameSettingData";

export class MessageWindow extends Phaser.GameObjects.Graphics {
    public scene: Phaser.Scene;
    private backColor: number;
    private alphaValue: number;
    private lineColor: number;
    private fontSize: number;
    private rectR = 16;//一旦デフォルトは16
    public width: number = 0;
    public height: number = 0;

    constructor(scene: Phaser.Scene) {
        super(scene);
        this.scene = scene;
    }

    public init() {
        //DisplayListに追加
        this.scene.add.existing(this);

        //テキスト設定値取得用
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

        // シーン終了時にイベントを破棄
        this.scene.events.once('shutdown', () => {
            this.destroy();
        });
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

    //テキストを基準に画面下側にウィンドウを作成。左右はオフセットを設定。
    public createEventMessageWindow(messageObject: Phaser.GameObjects.Text, R?: number, extraTopHeight?: number) {
        const eventMessageSettings = GameSettingData.getEventMessageSettings(this.scene);
        const tileSize = 32;//マップのタイルサイズ32を基準とする
        const rectR = R ? R : eventMessageSettings.fontSize;//角の丸みの半径
        //const offset = tileSize * 4;
        const offset = 200;
        const extraTop = extraTopHeight ?? 0;

        //初期位置を設定
        this.x = offset;
        this.y = messageObject.y - tileSize - extraTop;

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

    public fadeIn(duration?: number) {
        this.scene.tweens.add({
            targets: this,
            alpha: this.alphaValue,
            duration: duration ? duration : 200,
            ease: 'Power1'
        });
    }

    public fadeOut(duration?: number) {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: duration ? duration : 200,
            ease: 'Power1'
        });
    }

    // 十字型のウィンドウを作成
    public createCrossWindow(centerX: number, centerY: number, buttonSize: number, R?: number) {
        const r = R ? R : 8; // 角の丸みの半径
        const hs = buttonSize / 2;
        const f = buttonSize * 1.5;
        const cx = centerX;
        const cy = centerY;

        this.x = 0;
        this.y = 0;

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);

        this.beginPath();
        // 上
        this.moveTo(cx - hs + r, cy - f);
        this.lineTo(cx + hs - r, cy - f);
        this.arc(cx + hs - r, cy - f + r, r, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360), false);
        // 内角1
        this.lineTo(cx + hs, cy - hs);
        // 右
        this.lineTo(cx + f - r, cy - hs);
        this.arc(cx + f - r, cy - hs + r, r, Phaser.Math.DegToRad(270), Phaser.Math.DegToRad(360), false);
        this.lineTo(cx + f, cy + hs - r);
        this.arc(cx + f - r, cy + hs - r, r, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90), false);
        // 内角2
        this.lineTo(cx + hs, cy + hs);
        // 下
        this.lineTo(cx + hs, cy + f - r);
        this.arc(cx + hs - r, cy + f - r, r, Phaser.Math.DegToRad(0), Phaser.Math.DegToRad(90), false);
        this.lineTo(cx - hs + r, cy + f);
        this.arc(cx - hs + r, cy + f - r, r, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(180), false);
        // 内角3
        this.lineTo(cx - hs, cy + hs);
        // 左
        this.lineTo(cx - f + r, cy + hs);
        this.arc(cx - f + r, cy + hs - r, r, Phaser.Math.DegToRad(90), Phaser.Math.DegToRad(180), false);
        this.lineTo(cx - f, cy - hs + r);
        this.arc(cx - f + r, cy - hs + r, r, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270), false);
        // 内角4
        this.lineTo(cx - hs, cy - hs);
        // 左上の角
        this.lineTo(cx - hs, cy - f + r);
        this.arc(cx - hs + r, cy - f + r, r, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(270), false);

        this.closePath();
        this.fillPath();
        this.strokePath();
    }

    // 円形のウィンドウを作成
    public createCircleWindow(centerX: number, centerY: number, radius: number) {
        this.x = 0;
        this.y = 0;

        this.fillStyle(this.backColor, 1).setAlpha(this.alphaValue);
        this.lineStyle(2, this.lineColor);

        this.fillCircle(centerX, centerY, radius);
        this.strokeCircle(centerX, centerY, radius);
    }

    get currentAlphaValue() {
        return this.alphaValue;
    }

}
