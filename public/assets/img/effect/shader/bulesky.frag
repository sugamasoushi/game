#ifdef GL_ES
precision mediump float;
#endif

uniform float time;
uniform vec2 resolution;

const float cloudscale = 1.1;
const float speed = 0.03;
const float clouddark = 0.5;
const float cloudlight = 0.3;
const float cloudcover = 0.2;
const float cloudalpha = 8.0;
const float skytint = 0.5; // 空の明るさを少し引き上げる
// 上側（スカイブルー）
const vec3 skycolour1 = vec3(0.3, 0.75, 1.0);
// 下側（明るい黄色）
const vec3 skycolour2 = vec3(1.0, 0.9, 0.3);

const mat2 m = mat2( 1.6,  1.2, -1.2,  1.6 );

// sinを使わない高精度ハッシュ関数（Dave Hoskins氏の Hash without Sine）
vec2 hash(vec2 p) {
	vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973));
	p3 += dot(p3, p3.yzx + 33.33);
	return fract((p3.xx + p3.yz) * p3.zy) * 2.0 - 1.0;
}

float noise( in vec2 p ) {
    const float K1 = 0.366025404; // (sqrt(3)-1)/2;
    const float K2 = 0.211324865; // (3-sqrt(3))/6;
	vec2 i = floor(p + (p.x+p.y)*K1);	
    vec2 a = p - i + (i.x+i.y)*K2;
    vec2 o = (a.x>a.y) ? vec2(1.0,0.0) : vec2(0.0,1.0); //vec2 of = 0.5 + 0.5*vec2(sign(a.x-a.y), sign(a.y-a.x));
    vec2 b = a - o + K2;
	vec2 c = a - 1.0 + 2.0*K2;
    vec3 h = max(0.5-vec3(dot(a,a), dot(b,b), dot(c,c) ), 0.0 );
	vec3 n = h*h*h*h*vec3( dot(a,hash(i+0.0)), dot(b,hash(i+o)), dot(c,hash(i+1.0)));
    return dot(n, vec3(70.0));	
}

float fbm(vec2 n) {
	float total = 0.0, amplitude = 0.1;
	for (int i = 0; i < 7; i++) {
		total += noise(n) * amplitude;
		n = m * n;
		amplitude *= 0.4;
	}
	return total;
}

// -----------------------------------------------

void main( void ) {
    // 基準となる高さをピクセル単位で定義（例: 600px）
    // この値を大きくすると雲は小さくなり、小さくすると雲は大きくなります
    const float baseHeight = 600.0;

    vec2 p = gl_FragCoord.xy / resolution.xy;
	vec2 uv = gl_FragCoord.xy / baseHeight;    
    float timeVal = time * speed;
    
    // 雲の流れる方向ベクトル（左上方向にするために調整。環境によって正負が逆になる場合はここを変更します）
    vec2 dir = vec2(1.0, -0.5);
    vec2 timeVec = timeVal * dir;
    
    float q = fbm(uv * cloudscale * 0.5);
    
    //ridged noise shape
	float r = 0.0;
	uv *= cloudscale;
    uv -= q - timeVec;
    float weight = 0.8;
    for (int i=0; i<8; i++){
		r += abs(weight*noise( uv ));
        uv = m*uv + timeVec;
		weight *= 0.7;
    }
    
    //noise shape
	float f = 0.0;
    uv = gl_FragCoord.xy / baseHeight;
	uv *= cloudscale;
    uv -= q - timeVec;
    weight = 0.7;
    for (int i=0; i<8; i++){
		f += weight*noise( uv );
        uv = m*uv + timeVec;
		weight *= 0.6;
    }
    
    f *= r + f;
    
    //noise colour
    float c = 0.0;
    timeVal = time * speed * 2.0;
    timeVec = timeVal * dir;
    uv = gl_FragCoord.xy / baseHeight;
	uv *= cloudscale*2.0;
    uv -= q - timeVec;
    weight = 0.4;
    for (int i=0; i<7; i++){
		c += weight*noise( uv );
        uv = m*uv + timeVec;
		weight *= 0.6;
    }
    
    //noise ridge colour
    float c1 = 0.0;
    timeVal = time * speed * 3.0;
    timeVec = timeVal * dir;
    uv = gl_FragCoord.xy / baseHeight;
	uv *= cloudscale*3.0;
    uv -= q - timeVec;
    weight = 0.4;
    for (int i=0; i<7; i++){
		c1 += abs(weight*noise( uv ));
        uv = m*uv + timeVec;
		weight *= 0.6;
    }
	
    c += c1;
    
    //グラデーション境界の調整
    // 0.2以下は完全に黄色、0.8以上は完全に青、その間(0.2〜0.8)をグラデーションにする
    vec3 skycolour = mix(skycolour2, skycolour1, smoothstep(0.2, 0.8, p.y));

    vec3 cloudcolour = vec3(1.1, 1.1, 0.9) * clamp((clouddark + cloudlight*c), 0.0, 1.0);
   
    f = cloudcover + cloudalpha*f*r;
    
    vec3 result = mix(skycolour, clamp(skytint * skycolour + cloudcolour, 0.0, 1.0), clamp(f + c, 0.0, 1.0));
    
	gl_FragColor = vec4( result, 1.0 );
}