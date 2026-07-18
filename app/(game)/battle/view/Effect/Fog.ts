import { BattleScene } from "@/app/(game)/lib/types";

export class Fog {

    private fog1: Phaser.GameObjects.TileSprite;
    private fog2: Phaser.GameObjects.TileSprite;

    constructor(private battleScene: BattleScene) { }

    //霧を作成
    public createFog(depth?: number) {



        // create 内
        const width = this.battleScene.sys.canvas.width;
        const height = this.battleScene.sys.canvas.height;

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        this.fog1 = this.battleScene.add.tileSprite(width / 2, height / 2, width, height, 'noise');

        // 2. 霧っぽく見せるための設定
        this.fog1.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        this.fog1.setAlpha(0.1);                         // 透明度を下げて「うっすら」にする

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        this.fog1.setScale(1.5);

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        this.fog2 = this.battleScene.add.tileSprite(width / 2, height / 2, width, height, 'noise2');

        // 2. 霧っぽく見せるための設定
        this.fog2.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        this.fog2.setAlpha(0.1);                         // 透明度を下げて「うっすら」にする

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        this.fog2.setScale(1.0);

        // 3. 毎フレーム、テクスチャの表示位置をずらす（スクロール）
        this.battleScene.events.on('update', () => {
            // X方向とY方向に少しずつずらすことで、斜めに流れる霧を表現
            this.fog1.tilePositionX += 0.3;
            this.fog1.tilePositionY += 0.2;
            this.fog2.tilePositionX += 0.9;
            this.fog2.tilePositionY += 0.4;
        });

        this.battleScene.events.once('shutdown', () => {
            this.battleScene.events.off('update')

            if (this.fog1) { this.fog1.destroy(); }
            if (this.fog2) { this.fog2.destroy(); }
        });

        if (depth) {
            this.fog1.setDepth(depth);
            this.fog2.setDepth(depth);
        }
    }

    public fogDestroy() {
        this.battleScene.events.off('update')
        if (this.fog1) { this.fog1.destroy(); }
        if (this.fog2) { this.fog2.destroy(); }
    }
}
