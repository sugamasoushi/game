export class PlayerViewData {

    public playerViewWidth: number;
    public playerViewHeight: number;
    private redraw = false;
    private minView = {};

    /*
     * 画面について
     * PC画面とスマホ画面に対応するが、スマホ画面については端末により変化する
     * web表示はスマホごとの論理ピクセルに変換されて表示される。
     * Rakuten BIGの画面解像度は2,460 × 1,080ピクセル（FHD+）だが、論理ピクセルはブラウザのヘッダ部を覗いて縦画面は424×830、横画面は925×329となる
     */

    constructor() {
        this.getViewInfomation();//現状、2回取得してるが改修すべき
        window.addEventListener("orientationchange", () => {
            console.log("画面が回転しました");
            this.redraw = true;
            setTimeout(() => {
                this.getViewInfomation();
                console.log("画面size = " + this.playerViewWidth + " * " + this.playerViewHeight);
            }, 100);
        });
    }

    public getViewInfomation() {
        // UserAgentからのスマホ判定
        if (navigator.userAgent.match(/iPhone|Android.+Mobile/)) {
            let width = window.innerWidth;
            let height = window.innerHeight;
            
            // 縦画面の場合、幅と高さを入れ替える（横画面固定）
            if (width < height) {
                [width, height] = [height, width];
            }
            
            this.playerViewWidth = width;
            this.playerViewHeight = height;
            console.log("接続 スマホ画面（横固定） " + this.playerViewWidth + " × " + this.playerViewHeight)
            this.minView = { view: 'LANDSCAPE', minPx: height };

        } else {//スマホ以外はPC
            this.playerViewWidth = window.innerHeight * 16 / 9;
            //this.playerViewWidth = window.innerWidth;
            this.playerViewHeight = window.innerHeight;
            console.log("接続 PC画面 " + this.playerViewWidth + " × " + this.playerViewHeight)
            this.minView = { view: 'PC', minPx: this.playerViewHeight }
        }
    }


}