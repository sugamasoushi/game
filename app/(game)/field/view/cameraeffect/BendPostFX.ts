const fragShader = `
#define SHADER_NAME BEND_FS

precision mediump float;

uniform sampler2D uMainSampler;
uniform float uTime;
uniform float uSpeed;
uniform float uBendFactor;

varying vec2 outTexCoord;

void main()
{
    float height = 1.0 - outTexCoord.y;
    float offset = pow(height, 2.5);

    offset *= (sin(uTime * uSpeed) * uBendFactor);

    vec4 texture = texture2D(uMainSampler, fract(vec2(outTexCoord.x + offset, outTexCoord.y)));

    gl_FragColor = texture;
}
`;

export default class BendPostFX extends Phaser.Renderer.WebGL.Pipelines.PostFXPipeline
{
    private _bend: number;
    private _speed: number;

    constructor (game: Phaser.Game)
    {
        super({
            game,
            renderTarget: true,
            fragShader
        });

        this._bend = 0.3;
        this._speed = 0.003;
    }

    onBoot ()
    {
        this.set1i('uMainSampler', 1);
    }

    onPreRender ()
    {
        this.set1f('uTime', this.game.loop.time);
        this.set1f('uSpeed', this._speed);
        this.set1f('uBendFactor', this._bend);
    }

    get bend (): number
    {
        return this._bend;
    }

    set bend (value: number)
    {
        this._bend = value;
    }

    get speed (): number
    {
        return this._speed;
    }

    set speed (value: number)
    {
        this._speed = value;
    }
}
