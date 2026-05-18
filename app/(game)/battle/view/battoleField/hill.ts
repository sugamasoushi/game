import { BattleScene } from "@/app/(game)/lib/types";

export class hill extends Phaser.GameObjects.Container {
    private debugFlg: boolean | undefined;

    private battle_hill_parts_01: Phaser.GameObjects.Image;
    private battle_hill_parts_02: Phaser.GameObjects.Image;
    private battle_hill_parts_03: Phaser.GameObjects.Image;

    private shader: Phaser.GameObjects.Shader | null = null;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = hill.name;
        this.addToDisplayList();
        this.addToUpdateList();
        this.debugFlg = battleScene.game.config.physics.arcade?.debug;
    }

    public execute() {
        this.createBackground();
        this.createWaterSurface();
    }

    private createBackground() {
        const width = Number(this.scene.game.config.width);
        const height = Number(this.scene.game.config.height);

        //背景画像の作成
        this.battle_hill_parts_01 = this.scene.add.image(width / 2, height / 2, 'battle_hill_01');
        this.battle_hill_parts_02 = this.scene.add.image(width / 2, height / 2, 'battle_hill_02');
        this.battle_hill_parts_03 = this.scene.add.image(width / 2, height / 2, 'battle_hill_03');

        this.battle_hill_parts_01.setDepth(10);
        this.battle_hill_parts_02.setDepth(9);
        this.battle_hill_parts_03.setDepth(8);
    }

    private createWaterSurface() {

        // タイルマップから解像度を取得
        const width = this.scene.game.canvas.width;
        const height = this.scene.game.canvas.height;

        this.shader = this.scene.add.shader('blueSky', width / 2, height / 2, width, height);
        this.shader.setDepth(0);



        // const linearFadeFrag = `
        //     #ifdef GL_ES
        //     precision mediump float;
        //     #endif

        //     varying vec2 outTexCoord;

        //     void main(void) {
        //         // --- 1. カラーコードの定義 (RGBを0.0～1.0の範囲で指定) ---
        //         // 上側の明るい青 (Hex: #00bfff 相当の鮮やかなスカイブルー)
        //         vec3 topColor = vec3(0.0, 0.75, 0.1);
                
        //         // 下側の黄色 (Hex: #ffd700 相当の温かみのあるゴールド・イエロー)
        //         vec3 bottomColor = vec3(1.0, 0.84, 0.1);

        //         // --- 2. 上下の色を縦方向（uv.y）でグラデーションブレンド ---
        //         // outTexCoord.y は上が 0.0、下が 1.0 なので、そのまま mix の比率に使えます
        //         vec3 finalColor = mix(topColor, bottomColor, outTexCoord.y);

        //         // --- 3. アルファ値（透明度）の計算 ---
        //         // 上が不透明（1.0）、下に行くほど透明（0.0）
        //         float alpha = 0.2 - outTexCoord.y;

        //         // 最終的な色と透明度を出力
        //         gl_FragColor = vec4(finalColor, alpha);
        //     }
        // `;

        // // 画面全体に引き伸ばして配置
        // const fadeShader = this.scene.add.shader(
        //     new Phaser.Display.BaseShader('linearFade', linearFadeFrag),
        //     width / 2, height / 2,
        //     width, height
        // );
        // fadeShader.setDepth(1);
    }

    public destroy() {

        this.battle_hill_parts_01.destroy();
        this.battle_hill_parts_02.destroy();
        this.battle_hill_parts_03.destroy();
        this.shader?.destroy();

        super.destroy();
    }
}
