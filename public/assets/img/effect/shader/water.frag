#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;
uniform sampler2D bgTexture; 

// sinを使わない高精度2Dハッシュ（Dave Hoskins氏の Hash without Sine）
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
	// 異なる速度・スケールで進む複数の波を重ね合わせ、リアリティを出します
	vec2 uv1 = uv * 2.0 + vec2(time * 0.08, time * 0.12);
	vec2 uv2 = uv * 4.0 - vec2(time * 0.15, time * 0.05);
	vec2 uv3 = uv * 8.0 + vec2(time * 0.20, -time * 0.10);
	
	float h = noise(uv1) * 0.5 + noise(uv2) * 0.3 + noise(uv3) * 0.2;
	return h;
}

void main(void) {
	// 画面全体の正規化UV座標
	vec2 uv = gl_FragCoord.xy / resolution.xy;
	
	// 遠近感（パース）の計算：上（奥）に行くほど波のピッチを縦に細かくします
	// このパースペクティブ補正により、Phaser 4 のサンプル画像のような見事な奥行き感が生まれます
	float perspective = 1.0 / (uv.y * 2.0 + 0.1);
	vec2 waveUV = vec2(uv.x * 4.0, (1.0 - uv.y) * 10.0 * perspective);
	
	// 動的法線ベクトル（Normal）の計算（隣接座標の高さの差分から勾配を求めます）
	vec2 eps = vec2(0.015, 0.0);
	float hL = getWaveHeight(waveUV - eps.xy);
	float hR = getWaveHeight(waveUV + eps.xy);
	float hD = getWaveHeight(waveUV - eps.yx);
	float hU = getWaveHeight(waveUV + eps.yx);
	
	// 法線の組み立て（zを小さくすると波が鋭くなり、反射が煌びやかになります）
	vec3 normal = normalize(vec3((hL - hR), (hD - hU), 0.12));
	
	// 水面下画像の屈折（手前に行くほど歪み量を大きく調整）
	vec2 distortion = normal.xy * 0.02 * (uv.y + 0.1);
	vec2 distortedUV = clamp(uv + distortion, 0.0, 1.0);
	
	// 歪ませたUV座標で背景画像をサンプリング
	vec4 texColor = texture2D(bgTexture, distortedUV);
	
	// 水面らしい青・グリーンのグラデーション色を設定
	vec3 waterBaseColor = mix(vec3(0.02, 0.12, 0.32), vec3(0.05, 0.42, 0.58), uv.y);
	
	// 水自体の色と背景色のブレンド
	vec3 finalColor = mix(texColor.rgb, waterBaseColor, 0.40);
	
	// スペキュラーハイライト（太陽光が水面でキラキラと輝く白い反射光）
	vec3 lightDir = normalize(vec3(0.0, 1.0, 0.7)); // 上方からの太陽光
	vec3 viewDir = vec3(0.0, 0.0, 1.0);
	vec3 halfDir = normalize(lightDir + viewDir);
	
	// 反射強度の計算
	float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);
	
	// 波の峰（法線の傾きが上向きの部分）だけに反射を乗せるマスク
	float waveCrest = max(0.0, normal.y * 2.0);
	vec3 specularColor = vec3(1.0, 1.0, 1.0) * spec * 2.5 * waveCrest;
	
	// 最終出力
	gl_FragColor = vec4(finalColor + specularColor, 1.0);
}