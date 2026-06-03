import { FieldScene } from "@/app/(game)/lib/SceneTypes";
import { MapLayerDepth } from "@/app/(game)/lib/FieldTypes";
import { TileMap } from "../TileMap";
import { ExecutionEnvironment } from "@/app/(game)/core/ExecutionEnvironment";

export class WaterReflectionShader {
    private debugFlg: boolean | undefined;
    private waterShaderList: Array<Phaser.GameObjects.Shader> = [];
    private waterCropRectMaskList: Array<Phaser.GameObjects.Graphics> = [];

    constructor(private fieldScene: FieldScene, private tileMap: TileMap) {
        this.debugFlg = fieldScene.game.config.physics.arcade?.debug;
    }

    public async execute() {
        this.createWaterReflectionShader();
    }

    private createWaterReflectionShader() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.tileMap.getMakeTilemap();
        if (makeTileMap.getObjectLayer('WATER_SURFACE')) {

            if (makeTileMap.getObjectLayer('WATER_SURFACE')!.objects.length! > 1) {
                alert("WaterSurfaceのオブジェクト配置は1つのみです")
            }

            // PC版（Electron）かどうかの判定
            const execEnv = new ExecutionEnvironment();
            if (execEnv.isElectron() || this.debugFlg) {
                this.createPcVersion();
            } else {
                this.createSmartPhoneVersion();
            }
        }
    }

    private createPcVersion() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.tileMap.getMakeTilemap();

        const targetWaterY = makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].y!
        let targetOffsetYBg = makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].properties!;

        for (const obj of makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].properties!) {
            if (obj.name === 'offsetYBg') { targetOffsetYBg = obj.value; }
        }

        // タイルマップから解像度を取得
        const width = this.tileMap.getMakeTilemap().widthInPixels;
        const height = this.tileMap.getMakeTilemap().heightInPixels;

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
        const shader = this.fieldScene.add.shader(base, width / 2, height / 2, width, height,
            ['bg_captured_image', 'char_captured_image']
        );
        //shader.setUniform('offsetY_bg', targetOffsetYBg);//setUniformだと反映されない

        const cropRectMask = this.fieldScene.add.graphics();
        cropRectMask.x = 0;//座標初期値を設定
        cropRectMask.y = 0;
        cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        cropRectMask.fillRect(0, 0, width, targetWaterY);
        cropRectMask.setVisible(false);//非表示にする

        shader.setMask(cropRectMask.createGeometryMask().setInvertAlpha());
        shader.setDepth(MapLayerDepth.Lowest + 10);//MapLayerDepth.Low

        this.waterShaderList.push(shader);
        this.waterCropRectMaskList.push(cropRectMask);

        this.fieldScene.events.on('shutdown', () => {
            console.log('shutdown');
            this.waterShaderList.forEach(shader => shader.destroy());
            this.waterCropRectMaskList.forEach(cropRectMask => cropRectMask.destroy());
            this.waterShaderList = [];
            this.waterCropRectMaskList = [];
        });
    }

    private async createSmartPhoneVersion() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.tileMap.getMakeTilemap();

        // タイルマッププロパティから 'WaterSurface' と 'WaterOffsetY' を検索する
        const targetWaterY = makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].y!
        let targetOffsetYBg = 0;

        for (const obj of makeTileMap.getObjectLayer('WATER_SURFACE')!.objects[0].properties!) {
            if (obj.name === 'offsetYBg') { targetOffsetYBg = obj.value; }
        }

        // タイルマップから解像度を取得
        const width = this.tileMap.getMakeTilemap().widthInPixels;
        const height = this.tileMap.getMakeTilemap().heightInPixels;

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
                // float highlight = smoothstep(0.85, 1.0, waveX * waveY * 0.5 + 0.5) * 0.25 * fade;
                // vec3 specularColor = vec3(1.0, 1.0, 1.0) * highlight;
                
                // gl_FragColor = vec4(finalColor + specularColor, 1.0);
            }
        `;

        const base = new Phaser.Display.BaseShader('simpleTexture', frag, undefined, {
            offsetY_bg: { type: '1f', value: targetOffsetYBg }
        });

        // 背景とキャラの2つのテクスチャを配列で渡す（それぞれ iChannel0, iChannel1 にバインドされる）
        const shader = this.fieldScene.add.shader(base, width / 2, height / 2, width, height,
            ['bg_captured_image', 'char_captured_image'],
            {
                // 💡 ここで渡すと、PhaserがシェーダーをGPUにバインドした瞬間に確実に値が適用されます
                offsetY_bg: { type: 'f', value: targetOffsetYBg }
            }
        );

        const cropRectMask = this.fieldScene.add.graphics();
        cropRectMask.x = 0;//座標初期値を設定
        cropRectMask.y = 0;
        cropRectMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        cropRectMask.fillRect(0, 0, width, targetWaterY);
        cropRectMask.setVisible(false);//非表示にする

        shader.setMask(cropRectMask.createGeometryMask().setInvertAlpha());
        shader.setDepth(MapLayerDepth.Lowest + 10);//MapLayerDepth.Low

        this.waterShaderList.push(shader);
        this.waterCropRectMaskList.push(cropRectMask);

        this.fieldScene.events.on('shutdown', () => {
            this.waterShaderList.forEach(shader => shader.destroy());
            this.waterCropRectMaskList.forEach(cropRectMask => cropRectMask.destroy());
            this.waterShaderList = [];
            this.waterCropRectMaskList = [];
        });
    }
}