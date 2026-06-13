import { FieldScene } from "../../lib/SceneTypes";
import { TileMap } from "./TileMap";
import { Player } from "./character/Player";
import { GameStateManager } from "../../core/GameStateManager";

import PlasmaPost2FX from '../../../../public/assets/img/effect/pipelines/PlasmaPost2FX.js';

export class MapObject extends Phaser.GameObjects.Container {

    private gameScene: FieldScene;
    private TileMap: TileMap;

    private treeGlassSpriteObjects: Phaser.Physics.Arcade.StaticGroup;
    private treeStemSpriteObjects: Phaser.Physics.Arcade.StaticGroup;

    private plane!: Phaser.GameObjects.Plane;
    private shineShader?: Phaser.GameObjects.Shader;
    // クラスのメンバ変数として、前フレームのカメラ位置を記憶
    private lastCameraX: number = 0;
    private lastCameraY: number = 0;

    constructor(scene: FieldScene) {
        super(scene);
        this.gameScene = scene;
        this.addToUpdateList();
    }

    public async execute(tileMap: TileMap) {
        this.TileMap = tileMap;
        await this.createObject();

        this.testShader()

        //テスト用平面表示
        //this.createPlane();

        //const pipeline = this.scene.cameras.main.setPostPipeline(PlasmaPost2FX);

    }

    private testShader() {
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        //this.scene.add.shader('fireball', 400, 300, 800, 600);

        //this.fieldScene.add.shader('blueSky', width / 2, height / 2, width, height);
        //this.fieldScene.add.shader('nightsky', width / 2, height / 2, width, height);

        //this.scene.add.shader('sunRays', width / 2, height / 2, width, height);
    }

    private createObject() {
        return new Promise<void>(async (resolve) => {
            const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

            // オブジェクトレイヤーの存在チェックを行い、警告を回避する
            let treeGlassSpriteObjects: Phaser.GameObjects.GameObject[] = [];
            let treeStemSpriteObjects: Phaser.GameObjects.GameObject[] = [];

            if (makeTileMap.getObjectLayer('SPRITE')) {

                treeGlassSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
                    name: 'tree_glass',  // Tiledでオブジェクトに付けた「名前」を指定
                    key: 'tex_tree_glass' // spritesheetKey
                });
                treeStemSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
                    name: 'tree_stem',  // Tiledでオブジェクトに付けた「名前」を指定
                    key: 'tex_tree_stem' // spritesheetKey
                });
            }


            //静的オブジェクトに設定
            this.treeGlassSpriteObjects = this.gameScene.physics.add.staticGroup(treeGlassSpriteObjects);
            this.treeStemSpriteObjects = this.gameScene.physics.add.staticGroup(treeStemSpriteObjects);

            //静的オブジェクトの子要素を取得
            const treeGlassSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.treeGlassSpriteObjects.getChildren();
            const treeStemSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.treeStemSpriteObjects.getChildren();

            for (const obj of treeGlassSpriteObjectStaticGroupChildren) {
                await this.settingTreeGlassSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
            }
            for (const obj of treeStemSpriteObjectStaticGroupChildren) {
                await this.settingTreeStemSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
            }

            resolve();
        });
    }

    private settingTreeGlassSpriteObjects(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {

            obj.setDepth(this.TileMap.getMakeTilemap().heightInPixels > this.TileMap.getMakeTilemap().widthInPixels ? this.TileMap.getMakeTilemap().heightInPixels : this.TileMap.getMakeTilemap().widthInPixels);

            obj.setOrigin(0.5, 1);

            obj.setPosition(obj.x, obj.y + 96 / 2);

            // 風で揺れるTweenアニメーションを作成
            this.gameScene.tweens.add({
                targets: obj,
                angle: { from: -2, to: 2 },
                ease: 'sine.easeInOut',
                duration: 2000,
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });

            resolve();
        });
    }
    private settingTreeStemSpriteObjects(obj: Phaser.Physics.Arcade.Sprite) {
        obj.setDepth(obj.y);
    }


    private updatePlaneRotation() {
        if (!this.plane) return;

        const gameStateManager = GameStateManager.getInstance();
        const player = gameStateManager.currentPlayerPartyList[0] as Player;

        // クラスのプロパティとして基準値を保持しておきます
        const viewHeight = this.TileMap.getMakeTilemap().heightInPixels;

        try {
            if (player) {
                const camera = this.gameScene.cameras.main;
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
        } catch (e) {
            // 安全対策
        }
    }

    private createPlane() {
        const tilemap = this.TileMap.getMakeTilemap();
        const width = tilemap.widthInPixels;
        const height = tilemap.heightInPixels;

        const screenCenterX = this.gameScene.scale.width / 2;
        const screenCenterY = this.gameScene.scale.height / 2;

        // 1. RenderTexture でマップをキャプチャ
        const layersToDraw = this.TileMap.getTilemapLayerList();
        if (layersToDraw.length === 0) { return; }

        const bgRenderTexture = this.gameScene.add.renderTexture(0, 0, width, height);
        for (const tilemapLayer of layersToDraw) {
            // 確実に左上 (0, 0) から描画されるように座標を指定
            bgRenderTexture.draw(tilemapLayer, 0, 0);
        }
        bgRenderTexture.saveTexture('testPlane_image');
        bgRenderTexture.setVisible(false);

        // --- 💡 改善ポイント1: テクスチャのラッピング設定 ---
        const texture = this.gameScene.textures.get('testPlane_image');
        if (texture && texture.source && texture.source[0]) {
            texture.source[0].setFilter(Phaser.Textures.FilterMode.LINEAR);
        }

        // --- 💡 改善ポイント2: Planeの初期配置とサイズの調整 ---
        // マップの中心座標 (width / 2, height / 2) に配置し、カメラのスクロールに追従させます。
        this.plane = this.gameScene.add.plane(screenCenterX, screenCenterY, 'testPlane_image');

        // --- 💡 改善ポイント3: 最初から「床」っぽく傾けておく（オプション） ---
        this.plane.modelRotation.x = Phaser.Math.DegToRad(-50);


        // this.plane.modelPosition.y = 0.04;
        // this.plane.modelPosition.z = 0.09;
        // console.log(this.plane.modelPosition);

        //this.plane.panZ(1 / this.TileMap.getMakeTilemap().heightInPixels);
        // console.log(1 / this.TileMap.getMakeTilemap().heightInPixels);


        this.gameScene.cameras.main.startFollow(this.plane, true);
        this.plane.setScrollFactor(0, 0);

        // お試し表示のため、一時的に元のマップレイヤーを非表示にする
        // これにより Plane だけが描画されていることを明確に確認できます
        for (const layer of this.TileMap.getTilemapLayerList()) {
            layer.setVisible(false);
            //layer.setAlpha(0.5);
        }
    }
}