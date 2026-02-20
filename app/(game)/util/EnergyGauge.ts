export class EnergyGauge extends Phaser.GameObjects.Graphics {
    //gaugeHP,gaugeCaseHP,gaugeMP,gaugeCaseMP
    private characterObject: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Image;

    private rectR: number;
    private value: number;
    private maxValue: number;
    private width: number;
    private height: number;

    constructor(scene: Phaser.Scene, characterObject: Phaser.Physics.Arcade.Sprite | Phaser.GameObjects.Image, type: string) {
        super(scene);
        this.scene = scene;
        this.characterObject = characterObject;
        this.name = characterObject.name;
        this.type = type;
        this.scene.add.existing(this);
        this.addToDisplayList();
        this.createGauge();
    }

    preUpdate(time: number, delta: number) {
        this.gauge();
    }

    private createGauge() {
        try {
            this.gauge();
            this.gaugeCase();
            if (this.type !== 'HP' && this.type !== 'MP' && this.type !== 'MaxHP' && this.type !== 'MaxMP') {
                throw new Error(`type is missing`);
            }
        } catch (error) {
            console.log(error); //try chatchやりたかった
        }
    }

    private gauge() {
        if (this.type !== 'HP' && this.type !== 'MP') return;
        this.clear();//再描画のためクリア

        const value = this.type === 'HP' ? this.characterObject.getData('HP') : this.characterObject.getData('MP');
        const maxValue = this.type === 'HP' ? this.characterObject.getData('MaxHP') : this.characterObject.getData('MaxMP');

        const rectR = this.rectR ? this.rectR : 4;//角の丸みの半径
        const maxWidth = this.width ? this.width : 100 + rectR * 2;
        const nowGageHeight = this.height ? this.height : 16 + rectR * 2;

        const nowGageWidth = maxWidth * value / maxValue;

        let color;
        if (this.type === 'HP') {
            color = 0x3cb371;
        } else {
            color = 0x4169e1;
        }

        if (this.type === 'HP' && value / maxValue <= 4 / 10) {
            color = 0xdc143c;
        }

        this.fillStyle(color);
        this.fillRoundedRect(-1 * rectR, -1 * rectR, nowGageWidth, nowGageHeight, rectR);

        this.width = maxWidth;
        this.height = nowGageHeight;
    }

    //ゲージの縁
    //同時に作成すると上書きになるため別々にインスタンス化する事
    private gaugeCase() {
        if (this.type !== 'MaxHP' && this.type !== 'MaxMP') return;
        this.clear();//再描画のためクリア

        const rectR = this.rectR ? this.rectR : 4;//角の丸みの半径
        const maxWidth = this.width ? this.width : 100 + rectR * 2;
        const GageHeight = this.height ? this.height : 16 + rectR * 2;

        this.fillStyle(0x000000, 1);
        this.lineStyle(3, 0x000000);
        this.fillRoundedRect(-1 * rectR, -1 * rectR, maxWidth, GageHeight, rectR);
        this.strokeRoundedRect(-1 * rectR, -1 * rectR, maxWidth, GageHeight, rectR);

        this.width = maxWidth;
        this.height = GageHeight;
    }

    setRectR(rectR: number) {
        this.rectR = rectR;
        this.gauge();
        this.gaugeCase();
    }

    setWidth(width: number) {
        const rectR = this.rectR ? this.rectR : 4;//角の丸みの半径
        this.width = width + rectR * 2;
        this.gauge();
        this.gaugeCase();
    }

    setHeight(height: number) {
        const rectR = this.rectR ? this.rectR : 4;//角の丸みの半径
        this.height = height + rectR * 2;
        this.gauge();
        this.gaugeCase();
    }

    public getWidth() { return this.width; }
    public getHeight() { return this.height; }
}
