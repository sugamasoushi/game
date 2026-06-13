/**
 * Straight Sunray Post FX Pipeline (Tapered)
 */

const fragShader = `
#define SHADER_NAME STRAIGHT_SUNRAY_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform vec2 uResolution;
uniform vec2 uRayDir;       // 光の進む方向（正規化されたベクトル）
uniform vec3 uRayColor;     // 光の色 (RGB)
uniform float uTime;        // アニメーション用の時間
uniform float uDensity;     // 光の筋の細かさ・密度
uniform float uSpeed;       // 光が揺らめく速度
uniform float uStrength;    // 光の全体的な強さ
uniform float uThickness;   // 太さ
uniform float uAlpha;       // 透明度

varying vec2 outTexCoord;

void main ()
{
    vec2 uv = outTexCoord;
    
    // 元の画面（テクスチャ）の色を取得
    vec4 baseColor = texture2D(uMainSampler, uv);
    
    // アスペクト比の補正
    float aspectRatio = uResolution.x / uResolution.y;
    vec2 st = uv * vec2(aspectRatio, 1.0);

    // 1. 各ピクセルを光の方向ベクトルに投影（平行な筋のベース）
    float projection = st.x * uRayDir.x + st.y * uRayDir.y;
    
    // 2. 時間経過による動くノイズ（光の筋）の生成
    float timeOffset = -uTime * uSpeed;
    float rays = sin(projection * uDensity + timeOffset);
    rays += sin(projection * (uDensity * 1.43) - timeOffset * 1.3) * 0.5;
    rays += sin(projection * (uDensity * 2.51) + timeOffset * 1.8) * 0.3;
    
    rays = max(0.0, rays);
    
    // --- 【ここを修正】上側を太く、下側を細くする計算 ---
    // uv.y は画面上部が 0.0、下部が 1.0 になる。
    // 上側（uv.yが0に近い）のときは乗数を小さく（例: 1.5 ＝ 太い）
    // 下側（uv.yが1に近い）のときは乗数を大きく（例: 1.5 + 4.5 = 6.0 ＝ 細い）する
    //float thicknessPower = 1.5 + (uv.y * 4.5); 
    float thicknessPower = uThickness + (uv.y * 4.5);
    
    // 動的に変化する乗数で光のシャープさを調整
    rays = pow(rays, thicknessPower) * uStrength;
    
    // 3. 画面上部・左側を強く、右下を弱くする減衰（フェードアウト）
    // float fade = (1.0 - uv.y) * 0.8 + (1.0 - uv.x) * 0.2;
    float fade = uv.y * 0.8 + (1.0 - uv.x) * 0.2;
    fade = smoothstep(0.0, 1.0, fade);
     
    // 最終的な光のエフェクト色
    // vec3 finalRayColor = uRayColor * rays * fade;
    float rayIntensity = rays * fade;
    vec3 finalRayColor = uRayColor * rayIntensity;

    // 透明度をエフェクト色へ反映してから元の画面に加算ブレンド
    finalRayColor *= uAlpha;
    gl_FragColor = vec4(baseColor.rgb + finalRayColor, baseColor.a);
}
`;

export default class StraightSunrayPostPipeline extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline {
    public rayDirection: Phaser.Math.Vector2;
    public rayColor: Phaser.Display.Color;
    public density: number;
    public speed: number;
    public strength: number;
    public thickness: number;
    public alpha: number;

    constructor(game: Phaser.Game) {
        super({
            game,
            fragShader
        });

        // パラメータ初期値
        // 真横にならないよう、斜め上（左上方向）へ向かうベクトルに設定
        this.rayDirection = new Phaser.Math.Vector2(-1, -1).normalize(); // 下左 から 上右 方向の斜め上向き
        this.density = 18.0;
        this.speed = 0.4;
        this.strength = 0.7;
        this.thickness = 0.5;
        this.alpha = 0.2;

        this.rayColor = new Phaser.Display.Color(255, 245, 210);
    }

    onPreRender(): void {
        this.setTime('uTime');
        this.set2f('uRayDir', this.rayDirection.x, this.rayDirection.y);
        this.set1f('uDensity', this.density);
        this.set1f('uSpeed', this.speed);
        this.set1f('uStrength', this.strength);
        this.set1f('uThickness', this.thickness);
        this.set1f('uAlpha', this.alpha);

        this.set3f(
            'uRayColor',
            this.rayColor.redGL,
            this.rayColor.greenGL,
            this.rayColor.blueGL
        );
    }

    onDraw(renderTarget: Phaser.Renderer.WebGL.RenderTarget): void {
        this.set2f('uResolution', renderTarget.width, renderTarget.height);
        this.bindAndDraw(renderTarget);
    }
}