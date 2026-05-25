import { GameScene } from "../../lib/SceneTypes";
import { FieldData, MapLayerDepth } from "../../lib/FieldTypes";
import { TileMap } from "./TileMap";
import { MapObject } from "./MapObject";
import { Npc } from "./character/Npc";
import { Player } from './character/Player';
import { Sound } from "../../scenes/Sound";
import { GameStateManager } from '@/app/(game)/GameAllState/GameStateManager';
import { ExecutionEnvironment } from '../../core/ExecutionEnvironment';

export class MapEffect extends Phaser.GameObjects.Container {
    private debugFlg: boolean | undefined;
    private fieldData: FieldData;

    private gameScene: GameScene;
    private TileMap: TileMap;
    private mapObject: MapObject;
    private player: Player;
    private playerPartyList: Phaser.Physics.Arcade.Sprite[] = [];
    private npcNormalList: Npc[] = [];
    private npcEnemyList: Npc[] = [];

    private eventObjects: Phaser.Physics.Arcade.StaticGroup;
    private clickEventObjects: Phaser.Physics.Arcade.Sprite[] = [];
    private mapMoveObjects: Phaser.Physics.Arcade.StaticGroup;
    private chestSpriteObjects: Phaser.Physics.Arcade.Sprite[] = [];
    private treeGlassSpriteObjects: Phaser.Physics.Arcade.StaticGroup;
    private treeStemSpriteObjects: Phaser.Physics.Arcade.StaticGroup;

    private soundScene: Sound;

    private playerLight: Phaser.GameObjects.Light;
    private playerLightFlg: boolean = false;
    private light: Phaser.GameObjects.Light[] = [];
    private lightObjectLayer: Phaser.Tilemaps.ObjectLayer;
    private lightFlg: boolean = false;
    private ellipse: Phaser.Geom.Ellipse[] = [];
    private timerEventObj: Phaser.Time.TimerEvent | null = null;

    private renderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private bgRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private renderTextureUpdateFlg: boolean = false;

    constructor(scene: GameScene) {
        super(scene);
        this.gameScene = scene;
        this.addToUpdateList();
        this.soundScene = this.gameScene.scene.get('Sound') as Sound;
        this.debugFlg = scene.game.config.physics.arcade?.debug;
    }

    public async execute(tileMap: TileMap, mapObject: MapObject) {
        this.TileMap = tileMap;
        this.player = mapObject.getPlayer();

        // リストを初期化
        this.playerPartyList = mapObject.getPlayerPartyList();
        this.npcNormalList = mapObject.getFieldNpclList();
        this.npcEnemyList = mapObject.getFieldEnemyList();
        this.light = [];
        this.ellipse = [];
        this.timerEventObj = null;

        this.setEffectInfomation();
        this.createShader()

        await this.createBgRenderTexture();
        await this.createCharacterRendertexture();



        this.createWaterReflectionShader();

        //エフェクトの作成
        this.createEffect();

        //lightの設定　※レンダーテクスチャ生成の後に作成しないとテクスチャが生成されない
        this.setLight2DPipeline()
        this.createLight();
    }

    preUpdate(time: number, delta: number) {
        this.updateRenderTexture();

        if (!this.playerLightFlg) return;
        this.playerLight.x = this.player.x;
        this.playerLight.y = this.player.y;
    }

    //エフェクトの情報を設定
    private setEffectInfomation() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        if (makeTileMap.getObjectLayer('LIGHT')) {
            this.lightFlg = true;
            this.lightObjectLayer = (makeTileMap.getObjectLayer('LIGHT')!);

        }
    }

    private createLight() {
        if (!this.lightFlg) return;
        return new Promise<void>(async (resolve) => {

            for (const obj of this.lightObjectLayer.objects) {

                //初期値
                let radius = 200;//光の半径
                let color = 0xffffff;//光の色
                let intensity = 1.0;//光の強さ

                for (const property of obj.properties) {
                    if (property.name === 'radius' && property.value !== '') { radius = property.value; }
                    if (property.name === 'color' && property.value !== '') { color = property.value; }
                    if (property.name === 'intensity' && property.value !== '') { intensity = property.value; }
                }

                const light = this.gameScene.lights.addLight(obj.x, obj.y, radius);
                light.setColor(color);
                light.setIntensity(intensity);

                const ellipse = new Phaser.Geom.Ellipse(obj.x, obj.y, 10, 10);

                this.timerEventObj = this.gameScene.time.addEvent({
                    delay: 100,
                    callback: function () {
                        Phaser.Geom.Ellipse.Random(ellipse, light);
                    },
                    callbackScope: this,
                    repeat: -1
                });

                this.light.push(light);
                this.ellipse.push(ellipse);
            }

            if (this.debugFlg) {
                this.playerLight = this.gameScene.lights.addLight(this.player.x, this.player.y, 200);
                this.playerLight.setIntensity(0.5);
                this.playerLightFlg = true;
            }

            this.gameScene.lights.enable()
            this.gameScene.lights.setAmbientColor(0xffffff);

            //タイルマップのプロパティからeffect情報を設定
            const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();
            if (Array.isArray(makeTileMap.properties)) {
                for (const prop of makeTileMap.properties) {
                    if (prop.name === 'ambientColor') {
                        //環境光の色を設定
                        this.gameScene.lights.setAmbientColor(prop.value);
                        //0xffffff
                        //0x222244
                    }
                }
            }
            resolve();
        });
    }

    private setLight2DPipeline() {
        if (!this.lightFlg) return
        for (const tp of this.TileMap.getTilemapLayerList()) {
            tp.setPipeline('Light2D');
        }
        for (const chestSpriteObject of this.chestSpriteObjects) {
            chestSpriteObject.setPipeline('Light2D');
        }
    }


    private createEffect() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        //タイルマップのプロパティからeffect情報を設定
        if (Array.isArray(makeTileMap.properties)) {
            for (const prop of makeTileMap.properties) {
                if (prop.name === 'fog') {
                    //エフェクトオブジェクトを作成
                    this.createFogTexture(prop.value);
                }

                if (prop.name === 'fog_front') {
                    //エフェクトオブジェクトを作成
                    this.createFog_Ground(prop.value);
                }
            }
        }
    }

    //霧を作成
    private createFogTexture(fogData: string) {

        // create 内
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        const fog = this.gameScene.add.tileSprite(width / 2, height / 2, width, height, 'noise');

        // 2. 霧っぽく見せるための設定
        fog.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        fog.setAlpha(0.1);                         // 透明度を下げて「うっすら」にする

        if (fogData === 'Lowest') {
            fog.setDepth(MapLayerDepth.Lowest + 10);
        } else {
            fog.setDepth(MapLayerDepth.Highest);
        }

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        fog.setScale(1.5);

        // 1. 通常の画像ではなく「TileSprite（並べて敷き詰められるスプライト）」として配置
        // 画面サイズより少し大きめにしておくと端が綺麗になります
        const fog2 = this.gameScene.add.tileSprite(width / 2, height / 2, width, height, 'noise2');

        // 2. 霧っぽく見せるための設定
        fog2.setBlendMode(Phaser.BlendModes.SCREEN); // 黒背景を透過させて白だけ残す
        fog2.setAlpha(0.3);                         // 透明度を下げて「うっすら」にする

        if (fogData === 'Lowest') {
            fog2.setDepth(MapLayerDepth.Lowest + 10);
        } else {
            fog2.setDepth(MapLayerDepth.Highest);
        }

        // 必要なら少し拡大してノイズの目を粗く（霧っぽく）する
        fog2.setScale(1.5);

        // 3. 毎フレーム、テクスチャの表示位置をずらす（スクロール）
        this.gameScene.events.on('update', () => {
            // X方向とY方向に少しずつずらすことで、斜めに流れる霧を表現
            fog.tilePositionX += 0.3;
            fog.tilePositionY += 0.2;
            fog2.tilePositionX += 0.9;
            fog2.tilePositionY += 0.4;
        });

        fog.setDepth(MapLayerDepth.Lowest + 1);
        fog2.setDepth(MapLayerDepth.Lowest + 2);

        //マップ外を非表示にするためのマスクを作成
        //メッセージ表示範囲のマスク作成
        const fogMask = this.gameScene.add.graphics();
        fogMask.x = 0;//座標初期値を設定
        fogMask.y = 0;
        fogMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        fogMask.fillRect(0, 0, width, height);
        //cropRectMask.fillPath().setDepth(messageObject.depth - 1);//確認用
        fogMask.setVisible(false);//非表示にする
        fog.setMask(fogMask.createGeometryMask());
        fog2.setMask(fogMask.createGeometryMask());



        //以下はbgRenderTextureとBitmapMaskの座標位置を補正するための変換処理
        // キャプチャしたテクスチャ名を使って、位置調整用のダミースプライトを作成する
        // ※座標を「画面の中心」にし、Originを「(0.5, 0.5)」にすることで、Phaserのマスク計算と完全一致させます。
        // const maskDummySprite = this.gameScene.add.sprite(width / 2, height / 2, 'bg_captured_image');
        // maskDummySprite.setOrigin(0.5, 0.5);
        // maskDummySprite.setVisible(false); // 画面には表示しない

        // // 3. このダミースプライトをソースにして BitmapMask を作成（型エラーは一切起きません）
        // const mapMask = new Phaser.Display.Masks.BitmapMask(this.gameScene, maskDummySprite);

        // 4. 霧にマスクを適用
        // fog.setMask(mapMask);
        // fog2.setMask(mapMask);
    }

    private createShader() {
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        // const testShader = this.gameScene.add.shader('fireball', 400, 300, 800, 600);

        //this.gameScene.add.shader('blueSky', width / 2, height / 2, width, height);
        //this.gameScene.add.shader('nightsky', width / 2, height / 2, width, height);


    }

    private createBgRenderTexture() {

        /**
         * マップ全体のテクスチャの生成、水面反射やマスク等に使用する。
         */

        return new Promise<void>(resolve => {

            // 背景専用のRenderTexture（絶対にクリアしない、マップ情報保持用）
            if (this.gameScene.textures.exists('bg_captured_image')) { this.gameScene.textures.removeKey('bg_captured_image'); }

            const width = this.TileMap.getMakeTilemap().widthInPixels;
            const height = this.TileMap.getMakeTilemap().heightInPixels;

            this.bgRenderTexture = this.gameScene.add.renderTexture(0, 0, width, height);
            for (const tilemapLayer of this.TileMap.getWaterSrufaceSubjectTilemapLayerList()) {
                this.bgRenderTexture.draw(tilemapLayer);
            }
            this.bgRenderTexture.saveTexture('bg_captured_image');
            this.bgRenderTexture.setVisible(false);

            resolve();
        });
    }

    private createCharacterRendertexture(): Promise<void> {

        /**
         * キャラクター専用のテクスチャの生成、水面反射やマスク等に使用する。
         */

        return new Promise<void>(resolve => {

            const width = this.TileMap.getMakeTilemap().widthInPixels;
            const height = this.TileMap.getMakeTilemap().heightInPixels;

            // 1. 【超重要】すでに古い RenderTexture やテクスチャキーが存在している場合は、完全に破棄・消去する
            if (this.renderTexture) {
                this.renderTexture.destroy(); // 既存のオブジェクトを破棄
                this.renderTexture = null;
            }

            // Phaserのテクスチャマネージャー内から古いキー名自体を消去する
            if (this.gameScene.textures.exists('char_captured_image')) { this.gameScene.textures.removeKey('char_captured_image'); }

            // 2. 毎フレーム更新・シェーダー渡し用のメインRenderTexture
            this.renderTexture = this.gameScene.add.renderTexture(0, 0, width, height);

            // 初回の描画 (背景は描画せず、キャラクターのみを上下反転させて描画)
            // const originalScaleY = this.player.scaleY;
            // this.player.scaleY *= -1; // 上下反転

            // // 足元で反射が繋がるように、Y座標をキャラの高さ分下にズラして描画
            // this.renderTexture.draw(this.player, this.player.x, this.player.y + this.player.displayHeight);

            // this.player.scaleY = originalScaleY; // 元に戻す



            for (const player of this.playerPartyList) {
                const originalScaleY = player.scaleY;
                player.scaleY *= -1; // 上下反転
                this.renderTexture.draw(player, player.x, player.y + player.displayHeight);
                player.scaleY = originalScaleY; // 元に戻す
            }

            for (const npc of this.npcNormalList) {
                if (npc.visible) {
                    const originalScaleY = npc.scaleY;
                    npc.scaleY *= -1; // 上下反転
                    this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                    npc.scaleY = originalScaleY; // 元に戻す
                }
            }

            for (const npc of this.npcEnemyList) {
                if (npc.visible) {
                    const originalScaleY = npc.scaleY;
                    npc.scaleY *= -1; // 上下反転
                    this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                    npc.scaleY = originalScaleY; // 元に戻す
                }
            }

            // この画像キーでシェーダーがキャラクターのテクスチャを参照します
            this.renderTexture.saveTexture('char_captured_image');
            this.renderTexture.setVisible(false);

            this.renderTextureUpdateFlg = true;

            resolve();
        });
    }

    private createWaterReflectionShader() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();
        if (makeTileMap.getObjectLayer('WATER_SURFACE')) {

            if (makeTileMap.getObjectLayer('WATER_SURFACE')!.objects.length! > 1) { alert("WaterSurfaceのオブジェクト配置は1つのみです") }

            // PC版（Electron）かどうかの判定
            const execEnv = new ExecutionEnvironment();
            if (execEnv.isElectron() || this.debugFlg) {
                this.createWaterSurface();

            } else {
                this.createWaterSurfaceSmartPhone();
            }
        }

    }

    private createWaterSurface() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        const targetWaterY = makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].y!
        let targetOffsetYBg = makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].properties!;

        for (const obj of makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].properties!) {
            if (obj.name === 'offsetYBg') { targetOffsetYBg = obj.value; }
        }

        // タイルマップから解像度を取得
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        const frag = `
            #ifdef GL_ES
            precision mediump float;
            #endif

            uniform float time;
            uniform vec2 resolution;
            uniform sampler2D iChannel0; // bg_captured_image (背景)
            uniform sampler2D iChannel1; // char_captured_image (キャラクター)
            uniform float offsetY_bg; // 外部から渡される反射位置オフセット

            // Phaser 3から自動的に渡される、このオブジェクト固有の正確なUV座標
            varying vec2 outTexCoord; 

            // sinを使わない高精度2Dハッシュ
            float hash(vec2 p) {
                vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
                p3 += dot(p3, p3.yzx + 33.33);
                return fract((p3.x + p3.y) * p3.z);
            }

            // 2Dバリューノイズ
            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
                        mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
            }

            // 波の高さを計算するマルチオクターブFBM
            float getWaveHeight(vec2 uv) {
                vec2 uv1 = uv * 2.0 + vec2(time * 0.08, time * 0.12);
                vec2 uv2 = uv * 4.0 - vec2(time * 0.15, time * 0.05);
                vec2 uv3 = uv * 8.0 + vec2(time * 0.20, -time * 0.10);
                
                float h = noise(uv1) * 0.5 + noise(uv2) * 0.3 + noise(uv3) * 0.2;
                return h;
            }

            void main(void) {
                // 【修正】画面ピクセル座標ではなく、オブジェクト固有の正確なUVを使用
                vec2 uv = outTexCoord;
                
                // 【フェード処理】上側（uv.yが小さい領域）ほど水面エフェクトを非表示にします。
                const float fadeStart = 0.0;
                const float fadeEnd = 0.30;
                float fade = smoothstep(fadeStart, fadeEnd, uv.y);
                
                // 【波の大きさを一定に保つためのスケール補正】
                // ★ここで波の大きさを自由に調整できます★
                // baseScale (1000.0) を基準サイズとしています。
                // ・数値を小さくする（例: 500.0） → 波が大きく（粗く）なります。
                // ・数値を大きくする（例: 2000.0） → 波が小さく（細かく）なります。
                vec2 baseScale = vec2(1000.0, 1000.0);
                vec2 scale = resolution / baseScale;

                // 遠近感（パース）の計算
                float perspective = 1.0 / (uv.y * 2.0 + 0.1);
                
                // scale を掛けることで、マップが広くなっても波が引き延ばされずに一定の大きさを保ちます
                vec2 waveUV = vec2(uv.x * 4.0 * scale.x, (1.0 - uv.y) * 10.0 * scale.y * perspective);
                
                // 動的法線ベクトル（Normal）の計算
                vec2 eps = vec2(0.015, 0.0);
                float hL = getWaveHeight(waveUV - eps.xy);
                float hR = getWaveHeight(waveUV + eps.xy);
                float hD = getWaveHeight(waveUV - eps.yx);
                float hU = getWaveHeight(waveUV + eps.yx);
                
                vec3 normal = normalize(vec3((hL - hR), (hD - hU), 0.12));

                // 【追加】スマホ版の簡易的なサイン・コサイン波による大きいうねりの歪みをブレンド
                // これにより、ノイズによる細かな質感とうねるような大きな波の動きが美しく融合します
                vec2 waveUV_smart = vec2(uv.x * 12.0 * scale.x, (1.0 - uv.y) * 15.0 * scale.y * perspective);
                float waveX = sin(waveUV_smart.x + time * 1.5) * cos(waveUV_smart.y + time * 1.0);
                float waveY = cos(waveUV_smart.x * 0.8 - time * 1.2) * sin(waveUV_smart.y * 1.2 + time * 1.6);
                vec2 smartDistortion = vec2(waveX, waveY) * 0.006 * fade;

                // 背景画像（マップ）の反射位置オフセットと屈折
                vec2 distortion_bg = normal.xy * (0.01 / scale) * (uv.y + 0.1) + smartDistortion;
                vec2 distortedUV_bg = clamp(uv + distortion_bg + vec2(0.0, offsetY_bg), 0.0, 1.0);
                vec4 bgTexColor = texture2D(iChannel0, distortedUV_bg);
                
                // キャラクター画像の反射位置オフセットと屈折
                // （テクスチャに描画する時点ですでに反転＆足元へズラしているため、ここでのオフセットはほぼ0でOKです）
                float offsetY_char = 0.0;
                
                // ★重要★
                // PhaserのShader全体が上下反転しているため、キャラだけ元の位置（足元）に戻すためにUVのYを反転させます
                vec2 charUV = vec2(uv.x, 1.0 - uv.y);
                
                vec2 distortion_char = normal.xy * (0.03 / scale) * (uv.y + 0.1) + smartDistortion * 1.5;
                vec2 distortedUV_char = clamp(charUV + distortion_char + vec2(0.0, offsetY_char), 0.0, 1.0);
                vec4 charTexColor = texture2D(iChannel1, distortedUV_char);
                
                // 背景の上にキャラクター（アルファブレンド）を重ねる
                vec4 texColor = mix(bgTexColor, charTexColor, charTexColor.a);
                
                // 水面らしい青・グリーンのグラデーション色を設定
                vec3 waterBaseColor = mix(vec3(0.02, 0.12, 0.32), vec3(0.05, 0.42, 0.58), uv.y);
                
                // 水自体の色と背景色のブレンド（上側ほど背景テクスチャをそのまま表示し、水のエフェクトを消す）
                vec3 finalColor = mix(texColor.rgb, waterBaseColor, 0.40 * fade);
                
                // スペキュラーハイライトも上側でフェードアウトさせます
                vec3 lightDir = normalize(vec3(0.0, 1.0, 0.7)); 
                vec3 viewDir = vec3(0.0, 0.0, 1.0);
                vec3 halfDir = normalize(lightDir + viewDir);
                
                float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
                
                float waveCrest = max(0.0, normal.y * 2.0);
                vec3 specularColor = vec3(1.0, 1.0, 1.0) * spec * 2.5 * waveCrest * fade;
                
                gl_FragColor = vec4(finalColor + specularColor, 1.0);
            }
        `;

        const base = new Phaser.Display.BaseShader('simpleTexture', frag, undefined, {
            offsetY_bg: { type: '1f', value: targetOffsetYBg! }
        });

        // 背景とキャラの2つのテクスチャを配列で渡す（それぞれ iChannel0, iChannel1 にバインドされる）
        const shader = this.gameScene.add.shader(base, width / 2, height / 2, width, height,
            ['bg_captured_image', 'char_captured_image']
        );
        //shader.setUniform('offsetY_bg', targetOffsetYBg);//setUniformだと反映されない

        const cropRectMask = this.gameScene.add.graphics();
        cropRectMask.x = 0;//座標初期値を設定
        cropRectMask.y = 0;
        cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        cropRectMask.fillRect(0, 0, width, targetWaterY);
        cropRectMask.setVisible(false);//非表示にする

        shader.setMask(cropRectMask.createGeometryMask().setInvertAlpha());
        shader.setDepth(MapLayerDepth.Lowest + 10);//MapLayerDepth.Low
    }

    private async createWaterSurfaceSmartPhone() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        // タイルマッププロパティから 'WaterSurface' と 'WaterOffsetY' を検索する
        const targetWaterY = makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].y!
        let targetOffsetYBg = 0;

        for (const obj of makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].properties!) {
            if (obj.name === 'offsetYBg') { targetOffsetYBg = obj.value; }
        }

        // タイルマップから解像度を取得
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        const frag = `
            #ifdef GL_ES
            precision mediump float;
            #endif

            uniform float time;
            uniform vec2 resolution;
            uniform sampler2D iChannel0; // bg_captured_image (背景)
            uniform sampler2D iChannel1; // char_captured_image (キャラクター)
            uniform float offsetY_bg; // 外部から渡される反射位置オフセット

            // Phaser 3から自動的に渡される、このオブジェクト固有の正確なUV座標
            varying vec2 outTexCoord; 

            void main(void) {
                vec2 uv = outTexCoord;
                
                // 【フェード処理】上側（uv.yが小さい領域）ほど水面エフェクトを非表示にします。
                const float fadeStart = 0.0;
                const float fadeEnd = 0.30;
                float fade = smoothstep(fadeStart, fadeEnd, uv.y);
                
                // 【波の大きさを一定に保つためのスケール補正】
                vec2 baseScale = vec2(1000.0, 1000.0);
                vec2 scale = resolution / baseScale;

                // 遠近感（パース）の計算
                float perspective = 1.0 / (uv.y * 2.0 + 0.1);
                
                // 簡易的なサイン・コサイン波によるUVの歪み計算（重いノイズや法線計算は一切行いません）
                // 縦方向と横方向で異なる周波数と速度の波を重ね合わせ、自然な水面の揺らぎを作ります
                vec2 waveUV = vec2(uv.x * 12.0 * scale.x, (1.0 - uv.y) * 15.0 * scale.y * perspective);
                
                float waveX = sin(waveUV.x + time * 1.5) * cos(waveUV.y + time * 1.0);
                float waveY = cos(waveUV.x * 0.8 - time * 1.2) * sin(waveUV.y * 1.2 + time * 1.6);
                
                // 歪み量（強度）を決定。上側でフェードさせます。
                vec2 distortion = vec2(waveX, waveY) * 0.008 * fade;

                // 背景画像（マップ）の反射位置オフセットと屈折
                vec2 distortedUV_bg = clamp(uv + distortion + vec2(0.0, offsetY_bg), 0.0, 1.0);
                vec4 bgTexColor = texture2D(iChannel0, distortedUV_bg);
                
                // キャラクター画像の反射位置オフセットと屈折
                vec2 charUV = vec2(uv.x, 1.0 - uv.y);
                vec2 distortedUV_char = clamp(charUV + distortion * 1.5, 0.0, 1.0);
                vec4 charTexColor = texture2D(iChannel1, distortedUV_char);
                
                // 背景の上にキャラクター（アルファブレンド）を重ねる
                vec4 texColor = mix(bgTexColor, charTexColor, charTexColor.a);
                
                // 水面らしい青・グリーンのグラデーション色を設定
                vec3 waterBaseColor = mix(vec3(0.02, 0.12, 0.32), vec3(0.05, 0.42, 0.58), uv.y);
                
                // 水自体の色と背景色のブレンド（上側ほど背景テクスチャをそのまま表示し、水のエフェクトを消す）
                vec3 finalColor = mix(texColor.rgb, waterBaseColor, 0.40 * fade);
                
                // 【簡易スペキュラーハイライト】
                // 重い法線反射ベクトル（normalizeやdot）を計算する代わりに、サイン波のピーク部分から直接きらめきを生成します
                float highlight = smoothstep(0.85, 1.0, waveX * waveY * 0.5 + 0.5) * 0.25 * fade;
                vec3 specularColor = vec3(1.0, 1.0, 1.0) * highlight;
                
                gl_FragColor = vec4(finalColor + specularColor, 1.0);
            }
        `;

        const base = new Phaser.Display.BaseShader('simpleTexture', frag, undefined, {
            offsetY_bg: { type: '1f', value: targetOffsetYBg }
        });

        // 背景とキャラの2つのテクスチャを配列で渡す（それぞれ iChannel0, iChannel1 にバインドされる）
        const shader = this.gameScene.add.shader(base, width / 2, height / 2, width, height,
            ['bg_captured_image', 'char_captured_image'],
            {
                // 💡 ここで渡すと、PhaserがシェーダーをGPUにバインドした瞬間に確実に値が適用されます
                offsetY_bg: { type: 'f', value: targetOffsetYBg }
            }
        );


        const cropRectMask = this.gameScene.add.graphics();
        cropRectMask.x = 0;//座標初期値を設定
        cropRectMask.y = 0;
        cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        cropRectMask.fillRect(0, 0, width, targetWaterY);
        cropRectMask.setVisible(false);//非表示にする

        shader.setMask(cropRectMask.createGeometryMask().setInvertAlpha());
        shader.setDepth(MapLayerDepth.Lowest + 10);//MapLayerDepth.Low
    }

    private updateRenderTexture() {
        if (!this.renderTextureUpdateFlg || !this.renderTexture || !this.bgRenderTexture) return;

        // 1. メインのRenderTextureをクリア（前回のプレイヤーの軌跡を完全に消す）
        this.renderTexture.clear();

        // 2. 静的な背景は別のテクスチャとして渡すため、ここでは描画しない

        // 3. 最新の座標でプレイヤーを上下反転させて描画
        // const originalScaleY = this.player.scaleY;
        // this.player.scaleY *= -1; // 上下反転

        // // 足元で反射が繋がるように、Y座標をキャラの高さ分下にズラして描画
        // this.renderTexture.draw(this.player, this.player.x, this.player.y + this.player.displayHeight);

        // this.player.scaleY = originalScaleY; // 元に戻す


        for (const player of this.playerPartyList) {
            const originalScaleY = player.scaleY;
            player.scaleY *= -1; // 上下反転
            this.renderTexture.draw(player, player.x, player.y + player.displayHeight);
            player.scaleY = originalScaleY; // 元に戻す
        }

        for (const npc of this.npcNormalList) {
            if (npc.visible) {
                const originalScaleY = npc.scaleY;
                npc.scaleY *= -1; // 上下反転
                this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                npc.scaleY = originalScaleY; // 元に戻す
            }
        }

        for (const npc of this.npcEnemyList) {
            if (npc.visible) {
                const originalScaleY = npc.scaleY;
                npc.scaleY *= -1; // 上下反転
                this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                npc.scaleY = originalScaleY; // 元に戻す
            }
        }
    }


    private async createFog_Ground(fogData: string) {

        // タイルマップから解像度を取得
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        const frag = `
			#ifdef GL_ES
			precision highp float;
			#endif

			#extension GL_OES_standard_derivatives : enable

			#define NUM_OCTAVES 6

			uniform float time;
            uniform float time2;
            uniform float speed;
			uniform vec2 resolution;
            uniform float fogStart;
            uniform float fogEnd;
            uniform float scale;
            varying vec2 outTexCoord;

			mat3 rotX(float a) {
			    float c = cos(a);
			    float s = sin(a);
			    return mat3(
			        1, 0, 0,
			        0, c, -s,
			        0, s, c
			    );
			}

			mat3 rotY(float a) {
			    float c = cos(a);
			    float s = sin(a);
			    return mat3(
			        c, 0, -s,
			        0, 1, 0,
			        s, 0, c
			    );
			}

			float random(vec2 pos) {
			    return fract(sin(dot(pos.xy, vec2(12.9898, 78.233))) * 43758.5453123);
			}

			float noise(vec2 pos) {
			    vec2 i = floor(pos);
			    vec2 f = fract(pos);
			    float a = random(i + vec2(0.0, 0.0));
			    float b = random(i + vec2(1.0, 0.0));
			    float c = random(i + vec2(0.0, 1.0));
			    float d = random(i + vec2(1.0, 1.0));
			    vec2 u = f * f * (3.0 - 2.0 * f);
			    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
			}

			float fbm(vec2 pos) {
			    float v = 0.0;
			    float a = 0.5;
			    vec2 shift = vec2(100.0);
                vec2 flow = vec2(time * speed, 0.0);
			    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));

                vec2 warp = vec2(
                    noise(pos * 0.3 + time * 0.05),
                    noise(pos * 0.3 - time * 0.04)
                );

                for (int i = 0; i < NUM_OCTAVES; i++) {
			        float dir = mod(float(i), 2.0) > 0.5 ? 1.0 : -1.0;

                    v += a * noise(pos + warp + flow);

			        pos = rot * pos * 2.0 + shift;
			        a *= 0.5;
			    }
			    return v;
			}

			void main(void) {
                //マップ固定
			    //vec2 p = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

                vec2 p = outTexCoord;
                p *= scale;

			    p -= vec2(12.0, 0.0);

			    float t = 0.0, d;

			    vec2 q = vec2(0.0);
			    q.x = fbm(p + 0.00 * time2);
			    q.y = fbm(p + vec2(1.0));
			    vec2 r = vec2(0.0);
			    r.x = fbm(p + 1.0 * q + vec2(1.7, 9.2) + 0.15 * time2);
			    r.y = fbm(p + 1.0 * q + vec2(8.3, 2.8) + 0.126 * time2);
			    float f = fbm(p + r);
			    
			    // 煙
			    // vec3 color = mix(
			    //     vec3(0.3, 0.3, 0.6),
			    //     vec3(0.7, 0.7, 0.7),
			    //     clamp((f * f) * 4.0, 0.0, 1.0)
			    // );

			    // color = mix(
			    //     color,
			    //     vec3(0.7, 0.7, 0.7),
			    //     clamp(length(q), 0.0, 1.0)
			    // );

			    // color = mix(
			    //     color,
			    //     vec3(0.4, 0.4, 0.4),
			    //     clamp(length(r.x), 0.0, 1.0)
			    // );

                //青白
                vec3 color = mix(
                    vec3(0.45, 0.55, 0.85),
                    vec3(0.85, 0.92, 1.0),
                    clamp((f * f) * 4.0, 0.0, 1.0)
                );

                color = mix(
                    color,
                    vec3(0.82, 0.90, 1.0),
                    clamp(length(q), 0.0, 1.0)
                );

                color = mix(
                    color,
                    vec3(0.65, 0.75, 0.95),
                    clamp(length(r.x), 0.0, 1.0)
                );

				// ============================================================
                // 🛠️ ピクセル単位での制御ロジック
                // ============================================================
                // gl_FragCoord.y は「画面下端からの生ピクセル数 (0 〜 画面縦幅)」です。
                float currentPixelY = outTexCoord.y * resolution.y;

                // smoothstep に直接ピクセル値を渡すことで、指定したピクセル間でのフェードを実現
                float offsetY = smoothstep(fogStart, fogEnd, currentPixelY);

                color *= offsetY;

			    color = (f * f * f + 0.9 * f * f + 0.8 * f) * color;

			    gl_FragColor = vec4(color * 0.7, color.r);
			}
        `;

        const base = new Phaser.Display.BaseShader('simpleTexture', frag, undefined, {
            time: { type: '1f', value: 0.5 },//生成速度（あまり分からない）
            time2: { type: '1f', value: 0.0 },//生成速度（あまり分からない）
            speed: { type: '1f', value: -0.3 },//　+：左方向、　-：右方向
            //resolution: { type: '2f', value: [width, height] },//scaleを使うので不要
            fogStart: { type: '1f', value: 600 },// 上側～指定位置の間が透明になる
            fogEnd: { type: '1f', value: 0 },// 下側～指定位置の間が不透明になる
            scale: { type: '1f', value: 4.0 }//大きさ
        });

        const shader = this.gameScene.add.shader(base, width / 2, height / 2, width, height);
        shader.setDepth(9999)

        if (fogData === 'Lowest') {
            shader.setDepth(MapLayerDepth.Lowest + 10);
        } else {
            shader.setDepth(MapLayerDepth.Highest);
        }
    }

}