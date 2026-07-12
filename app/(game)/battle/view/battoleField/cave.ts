import { BattleScene } from "@/app/(game)/lib/types";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";

export class cave extends Phaser.GameObjects.Container {
    private debugFlg: boolean | undefined;

    private backGroundImage: Phaser.GameObjects.Image;

    private maskShader: Phaser.GameObjects.Shader | null = null;

    private centerLight: Phaser.GameObjects.Light;
    private centerLightEllipse: Phaser.Geom.Ellipse;
    private centerTimerEventObj: Phaser.Time.TimerEvent;
    private centerLightFlg: boolean = false;

    private leftLight: Phaser.GameObjects.Light;
    private leftLightEllipse: Phaser.Geom.Ellipse;
    private leftTimerEventObj: Phaser.Time.TimerEvent;
    private leftLightFlg: boolean = false;

    private rightLight: Phaser.GameObjects.Light;
    private rightLightEllipse: Phaser.Geom.Ellipse;
    private rightTimerEventObj: Phaser.Time.TimerEvent;
    private rightLightFlg: boolean = false;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = cave.name;
        this.addToDisplayList();
        this.addToUpdateList();
        this.debugFlg = battleScene.game.config.physics.arcade?.debug;
    }

    public execute() {
        this.createBackground();
        this.createCenterLight();
        this.createLeftLight();
        this.createRightLight();
        this.createSparkling();
    }

    private createBackground() {
        const width = Number(this.scene.game.config.width);
        const height = Number(this.scene.game.config.height);

        //背景画像の作成
        this.backGroundImage = this.scene.add.image(width / 2, height / 2, 'battle_cave');
        this.backGroundImage.setPipeline('Light2D');
    }

    private createCenterLight() {
        const width = Number(this.scene.game.config.width) / 2;
        const height = Number(this.scene.game.config.height) / 2 - 200;
        const radius = 1000
        const intensity = 2.0
        const ambientLight = 0x181820

        const light = this.scene.lights.addLight(width, height, radius)
        light.setIntensity(intensity);

        this.scene.lights.enable().setAmbientColor(ambientLight);

        const ellipse = new Phaser.Geom.Ellipse(width, height, 10, 10);

        this.centerTimerEventObj = this.scene.time.addEvent({
            delay: 100,
            callback: function () {
                Phaser.Geom.Ellipse.Random(ellipse, light);
            },
            callbackScope: this,
            repeat: -1
        });

        this.centerLight = light;
        this.centerLightEllipse = ellipse;
        this.centerLightFlg = true;
    }

    private createLeftLight() {
        const width = Number(this.scene.game.config.width) / 2 - 400;
        const height = Number(this.scene.game.config.height) / 2 - 200;
        const radius = 200
        const intensity = 0.5
        const ambientLight = 0xddecff

        const light = this.scene.lights.addLight(width, height, radius)
        light.setIntensity(intensity);
        light.setColor(ambientLight);

        const ellipse = new Phaser.Geom.Ellipse(width, height, 10, 10);

        this.leftTimerEventObj = this.scene.time.addEvent({
            delay: 100,
            callback: function () {
                Phaser.Geom.Ellipse.Random(ellipse, light);
            },
            callbackScope: this,
            repeat: -1
        });

        this.leftLight = light;
        this.leftLightEllipse = ellipse;
        this.leftLightFlg = true;
    }

    private createRightLight() {
        const width = Number(this.scene.game.config.width) / 2 + 400;
        const height = Number(this.scene.game.config.height) / 2 - 200;
        const radius = 600
        const intensity = 3.0
        const ambientLight = 0xffe4e4

        const light = this.scene.lights.addLight(width, height, radius)
        light.setIntensity(intensity);
        light.setColor(ambientLight);

        const ellipse = new Phaser.Geom.Ellipse(width, height, 10, 10);

        this.rightTimerEventObj = this.scene.time.addEvent({
            delay: 100,
            callback: function () {
                Phaser.Geom.Ellipse.Random(ellipse, light);
            },
            callbackScope: this,
            repeat: -1
        });

        this.rightLight = light;
        this.rightLightEllipse = ellipse;
        this.rightLightFlg = true;
    }

    private async createSparkling() {

        // 描画判定
        const gameStateManager = GameStateManager.getInstance();
        if (gameStateManager.isHighDraw || gameStateManager.isDebugMode) {

            // タイルマップから解像度を取得
            const width = this.scene.game.canvas.width;
            const height = this.scene.game.canvas.height;

            const shader = this.scene.add.shader('nightsky', width / 2, height / 2, width, height);
            shader.setUniform('alpha', 0.3);

            // 1. まずシェーダーを作る（コードは最初にお渡ししたものでOKです）
            this.maskShader = this.scene.add.shader('circleMask', width / 2, height / 2, width, height);

            // マスク自体は画面に表示する必要がないので非表示にする
            this.maskShader.setVisible(false);

            // 2. このシェーダーを元に、Phaserの「BitmapMask」オブジェクトを作成する
            const bitmapMask = new Phaser.Display.Masks.BitmapMask(this.scene, this.maskShader);

            // 3. くり抜きたい対象にマスクを適用する
            // これにより、対象のオブジェクトは「円の内側」だけが表示されるようになります！
            shader.setMask(bitmapMask);

        } else {
            // モバイル端末など性能が低い環境では、シェーダーを使用しない
        }
    }

    public destroy() {
        this.centerLight = null!;
        this.leftLight = null!;
        this.rightLight = null!;

        this.centerTimerEventObj.destroy();
        this.leftTimerEventObj.destroy();
        this.rightTimerEventObj.destroy();

        this.backGroundImage.destroy();

        super.destroy();
    }
}
