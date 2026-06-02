import { FieldScene } from "@/app/(game)/lib/SceneTypes";
import { MapLayerDepth } from "@/app/(game)/lib/FieldTypes";
import { TileMap } from "@/app/(game)/field/view/TileMap";
import { ExecutionEnvironment } from "@/app/(game)/core/ExecutionEnvironment";

export class FogShader {
    private debugFlg: boolean | undefined;

    constructor(private fieldScene: FieldScene, private TileMap: TileMap) {
        this.debugFlg = fieldScene.game.config.physics.arcade?.debug;
    }

    public async execute() {
        this.setEffectInfomation();
        this.testShader()

        //エフェクトの作成
        this.createEffect();
    }

    public update(time: number, delta: number) { }

    //エフェクトの情報を設定
    private setEffectInfomation() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();
    }

    private testShader() {
        const width = this.TileMap.getMakeTilemap().widthInPixels;
        const height = this.TileMap.getMakeTilemap().heightInPixels;

        // const testShader = this.fieldScene.add.shader('fireball', 400, 300, 800, 600);

        //this.fieldScene.add.shader('blueSky', width / 2, height / 2, width, height);
        //this.fieldScene.add.shader('nightsky', width / 2, height / 2, width, height);
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
        const fog = this.fieldScene.add.tileSprite(width / 2, height / 2, width, height, 'noise');

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
        const fog2 = this.fieldScene.add.tileSprite(width / 2, height / 2, width, height, 'noise2');

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
        this.fieldScene.events.on('update', () => {
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
        const fogMask = this.fieldScene.add.graphics();
        fogMask.x = 0;//座標初期値を設定
        fogMask.y = 0;
        fogMask.fillStyle(Phaser.Display.Color.HexStringToColor('#ffffff').color);
        fogMask.fillRect(0, 0, width, height);
        //cropRectMask.fillPath().setDepth(messageObject.depth - 1);//確認用
        fogMask.setVisible(false);//非表示にする
        fog.setMask(fogMask.createGeometryMask());
        fog2.setMask(fogMask.createGeometryMask());

        this.fieldScene.events.on('shutdown', () => {
            fog.destroy();
            fog2.destroy();
        });
    }


    private async createFog_Ground(fogData: string) {

        // PC版（Electron）の場合に作成
        const execEnv = new ExecutionEnvironment();
        if (execEnv.isElectron() || this.debugFlg) {


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

            const shader = this.fieldScene.add.shader(base, width / 2, height / 2, width, height);
            shader.setDepth(9999)

            if (fogData === 'Lowest') {
                shader.setDepth(MapLayerDepth.Lowest + 10);
            } else {
                shader.setDepth(MapLayerDepth.Highest);
            }


            this.fieldScene.events.on('shutdown', () => {
                shader.destroy();
            });

        }
    }

}