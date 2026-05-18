#ifdef GL_ES
precision mediump float;
#endif

// Posted by Trisomie21 : 2D noise experiment (pan/zoom)

uniform float time;
uniform vec2 resolution;

float hash(vec2 p) {
	return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
	vec2 ip = p * 1000.0;
	vec2 i = floor(ip);
	vec2 f = fract(ip);
	
	float a = hash(i);
	float b = hash(i + vec2(1.0, 0.0));
	float c = hash(i + vec2(0.0, 1.0));
	float d = hash(i + vec2(1.0, 1.0));
	
	vec2 u = f * f * (3.0 - 2.0 * f);
	
	return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float cloud(vec2 p) {
	float v = 0.0;
	v += noise(p*1.)*.50000;
	v += noise(p*2.)*.2;
	v += noise(p*4.)*.12500;
	v += noise(p*8.)*.06250;
	v += noise(p*16.)*.03125;
	return v*v*v;
}

void main( void ) {
	const float baseHeight = 600.0;
	// タイルマップサイズに関わらず、雲が拡大しないように固定ピクセル基準でスケーリングし、中央を原点にします
	vec2 p = (gl_FragCoord.xy - resolution.xy * 0.5) / baseHeight * 0.08;

	vec3 c = vec3(.0, .0, .2);
	c.rgb += vec3(.6, .6, .8) * cloud(p*.3+time*.0002)*.6;
	c.gbr += vec3(.8, .8, 1.) * cloud(p*.2+time*.0002)*.8;
	c.grb += vec3(1., 1., 1.) * cloud(p*.1+time*.0002)*1.;
	gl_FragColor = vec4(c, 1.);
}