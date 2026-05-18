#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform vec2 center;      // Phaserから渡す円の中心座標 (ピクセル単位: 例 player.x, player.y)
uniform float radius;     // 円の半径 (ピクセル単位)
uniform float softness;   // 境界のぼかし幅 (0.0～1.0、大きいほど激しくぼける)

varying vec2 outTexCoord;

void main(void) {
    // 現在のピクセルの画面上の絶対座標を計算 (解像度を考慮)
    vec2 pixelPos = outTexCoord * resolution;

    // Phaserから値が渡されていない(0.0)場合のデフォルト値設定
    vec2 c = center;
    if (length(c) == 0.0) {
        c = resolution / 2.0; // 画面中央
    }
    float r = radius;
    if (r == 0.0) {
        r = min(resolution.x, resolution.y) * 0.4; // 画面の高さ/幅の40%
    }
    float s = softness;
    if (s == 0.0) {
        s = 0.1;
    }

    // 中心点からの距離を計算
    float dist = distance(pixelPos, c);

    // --- 境界を滑らかにぼかす処理 ---
    // 半径(r)を基準に、外側に向かってどれだけぼかすかを smoothstep で計算
    float edge0 = r;
    float edge1 = r + (r * s);
    
    // 円の内側は 1.0（不透明）、外側に向かって 0.0（透明）になるマスク値を計算
    float mask = 1.0 - smoothstep(edge0, edge1, dist);

    // mask値を使って、内側は不透明（アルファ1）、外側は透明（アルファ0）のマスクを作ります
    // PhaserのBitmapMaskは、色が塗られている（アルファ > 0）部分だけを表示します
    gl_FragColor = vec4(vec3(1.0), mask);
}
