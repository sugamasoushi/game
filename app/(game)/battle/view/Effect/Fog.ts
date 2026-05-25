import { BattleScene } from "@/app/(game)/lib/types";

export class Fog {

    constructor(private battleScene: BattleScene) { }

    //霧を作成
    public createFog() {

        // create 内
        const width = this.battleScene.sys.canvas.width;
        const height = this.battleScene.sys.canvas.height;

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        const fog = this.battleScene.add.tileSprite(width / 2, height / 2, width, height, 'noise');

        // 2. 霧っぽく見せるための設定
        fog.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        fog.setAlpha(0.2);                         // 透明度を下げて「うっすら」にする

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        fog.setScale(1.5);

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        const fog2 = this.battleScene.add.tileSprite(width / 2, height / 2, width, height, 'noise2');

        // 2. 霧っぽく見せるための設定
        fog2.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        fog2.setAlpha(0.7);                         // 透明度を下げて「うっすら」にする

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        fog2.setScale(1.0);

        // 3. 毎フレーム、テクスチャの表示位置をずらす（スクロール）
        this.battleScene.events.on('update', () => {
            // X方向とY方向に少しずつずらすことで、斜めに流れる霧を表現
            fog.tilePositionX += 0.3;
            fog.tilePositionY += 0.2;
            fog2.tilePositionX += 0.9;
            fog2.tilePositionY += 0.4;
        });
    }
}
