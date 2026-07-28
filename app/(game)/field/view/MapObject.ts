import { FieldScene } from "../../lib/SceneTypes";
import { TileMap } from "./TileMap";
import { Player } from "./character/Player";
import { gameStateManager } from "../../core/GameStateManager";

import { MapLayerDepth } from '@/app/(game)/lib/FieldTypes';

export class MapObject {

    private fieldScene: FieldScene;
    private TileMap: TileMap;

    private plane!: Phaser.GameObjects.Plane;
    private shineShader?: Phaser.GameObjects.Shader;

    private waterFallSprite: Phaser.GameObjects.Sprite;

    // クラスのメンバ変数として、前フレームのカメラ位置を記憶
    private lastCameraX: number = 0;
    private lastCameraY: number = 0;

    constructor(scene: FieldScene, tileMap: TileMap) {
        this.fieldScene = scene;
        this.TileMap = tileMap;

        this.fieldScene.anims.create({
            key: 'waterfall',
            frames: this.fieldScene.anims.generateFrameNumbers('waterfall', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });
    }

    update(time: number, delta: number) {
        void time;
        void delta;

        if (this.waterFallSprite) {
            this.waterFallSprite.setDepth(MapLayerDepth.High + this.waterFallSprite.y + (this.waterFallSprite.height / 2 - 32));
        }
        if (gameStateManager.currentFieldData.mapKey === '0002') {
            this.updatePlaneRotation()
        }
    }

    public async execute() {
        if (!(gameStateManager.currentFieldData.mapKey === '0001' || gameStateManager.currentFieldData.mapKey === '0002')) return

        if (gameStateManager.currentFieldData.mapKey === '0002') {
            this.testShader()

            //テスト用平面表示
            this.createPlane();
        }

        this.waterFallSprite = this.fieldScene.add.sprite(300, 300, 'waterfall');
        this.waterFallSprite.play('waterfall');

        this.fieldScene.events.once('shutdown', () => {
            this.waterFallSprite.destroy();

        })

    }

    private testShader() {
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        this.fieldScene.add.shader('fireball', width / 2, height / 2, width, height).setScale(0.3).setDepth(1000);
    }


    private updatePlaneRotation() {
        if (!this.plane) return;

        const player = gameStateManager.currentPlayerPartyList[0] as Player;

        // クラスのプロパティとして基準値を保持しておきます
        // const viewHeight = this.TileMap.getMakeTilemap().heightInPixels;

        if (player) {
            const camera = this.fieldScene.cameras.main;
            if (!player || !camera) return;

            // --- A. マップのスクロール（uvScroll）の同期 ---
            // 2Dカメラの「前フレームからの移動量（実際のスクロール量）」を計算
            const cameraDeltaX = camera.scrollX - this.lastCameraX;
            const cameraDeltaY = camera.scrollY - this.lastCameraY;

            // カメラが動いた分だけ、Planeのテクスチャをスクロールさせる（画面端では動かなくなる）
            // ※ 適切なスクロールスピード（比率）になるよう、テクスチャサイズ等に応じて係数を掛けてください
            const scrollFactorX = 1 / this.TileMap.getMakeTilemap().widthInPixels;
            const scrollFactorY = 1 / this.TileMap.getMakeTilemap().heightInPixels;

            this.plane.uvScroll(cameraDeltaX * scrollFactorX, cameraDeltaY * scrollFactorY);

            // 今回のカメラ位置を保存
            this.lastCameraX = camera.scrollX;
            this.lastCameraY = camera.scrollY;


        }

    }

    private createPlane() {
        const tilemap = this.TileMap.getMakeTilemap();
        const width = tilemap.widthInPixels;
        const height = tilemap.heightInPixels;

        const screenCenterX = this.fieldScene.scale.width / 2;
        const screenCenterY = this.fieldScene.scale.height / 2;

        // 1. RenderTexture でマップをキャプチャ
        const layersToDraw = this.TileMap.getTilemapLayerList();
        if (layersToDraw.length === 0) { return; }

        const bgRenderTexture = this.fieldScene.add.renderTexture(0, 0, width, height);
        for (const tilemapLayer of layersToDraw) {
            // 確実に左上 (0, 0) から描画されるように座標を指定
            bgRenderTexture.draw(tilemapLayer, 0, 0);
        }
        bgRenderTexture.saveTexture('testPlane_image');
        bgRenderTexture.setVisible(false);

        // --- 💡 改善ポイント1: テクスチャのラッピング設定 ---
        const texture = this.fieldScene.textures.get('testPlane_image');
        if (texture && texture.source && texture.source[0]) {
            texture.source[0].setFilter(Phaser.Textures.FilterMode.LINEAR);
        }

        // --- 💡 改善ポイント2: Planeの初期配置とサイズの調整 ---
        // マップの中心座標 (width / 2, height / 2) に配置し、カメラのスクロールに追従させます。
        this.plane = this.fieldScene.add.plane(screenCenterX, screenCenterY, 'testPlane_image');

        // --- 💡 改善ポイント3: 最初から「床」っぽく傾けておく（オプション） ---
        this.plane.modelRotation.x = Phaser.Math.DegToRad(-50);


        // this.plane.modelPosition.y = 0.04;
        // this.plane.modelPosition.z = 0.09;
        // console.log(this.plane.modelPosition);

        //this.plane.panZ(1 / this.TileMap.getMakeTilemap().heightInPixels);
        // console.log(1 / this.TileMap.getMakeTilemap().heightInPixels);


        this.fieldScene.cameras.main.startFollow(this.plane, true);
        this.plane.setScrollFactor(0, 0);

        // お試し表示のため、一時的に元のマップレイヤーを非表示にする
        // これにより Plane だけが描画されていることを明確に確認できます
        for (const layer of this.TileMap.getTilemapLayerList()) {
            layer.setVisible(false);
            //layer.setAlpha(0.5);
        }
    }
}