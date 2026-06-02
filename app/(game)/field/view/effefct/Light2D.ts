import { FieldScene } from "@/app/(game)/lib/SceneTypes";
import { TileMap } from "@/app/(game)/field/view/TileMap";
import { Player } from "@/app/(game)/field/view/character/Player";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";

export class Light2D {
    private debugFlg: boolean | undefined;

    private fieldScene: FieldScene;
    private TileMap: TileMap;
    private player: Player;
    private chestSpriteObjects: Phaser.Physics.Arcade.Sprite[] = [];

    private playerLight: Phaser.GameObjects.Light;
    private playerLightFlg: boolean = false;

    private light: Phaser.GameObjects.Light[] = [];
    private lightObjectLayer: Phaser.Tilemaps.ObjectLayer;
    private lightFlg: boolean = false;
    private ellipse: Phaser.Geom.Ellipse[] = [];
    private timerEventObj: Phaser.Time.TimerEvent | null = null;

    constructor(scene: FieldScene) {
        this.fieldScene = scene;
        this.debugFlg = scene.game.config.physics.arcade?.debug;
    }

    public async execute(tileMap: TileMap) {
        const gameStateManager = GameStateManager.getInstance();

        this.TileMap = tileMap;
        this.player = gameStateManager.currentPlayerPartyList[0] as Player;

        // リストを初期化
        this.light = [];
        this.ellipse = [];
        this.timerEventObj = null;

        this.setLightInfomation();
        this.createLight();
    }

    //lightの情報を設定
    private setLightInfomation() {
        const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();

        if (makeTileMap.getObjectLayer('LIGHT')) {
            this.lightFlg = true;
            this.lightObjectLayer = (makeTileMap.getObjectLayer('LIGHT')!);

            for (const tp of this.TileMap.getTilemapLayerList()) {
                tp.setPipeline('Light2D');
            }
            // for (const chestSpriteObject of this.chestSpriteObjects) {
            //     chestSpriteObject.setPipeline('Light2D');
            // }
        }
    }

    public update(time: number, delta: number) {
        if (!this.playerLightFlg) return;
        this.playerLight.x = this.player.x;
        this.playerLight.y = this.player.y;
    }

    private createLight() {
        if (!this.lightFlg) return;
        return new Promise<void>(async (resolve) => {

            /**
             * lightオブジェクトは効果対象のオブジェクトが削除されればPhaserが自動で削除される
             */

            for (const obj of this.lightObjectLayer.objects) {

                //初期値
                let radius = 200;//光の半径
                let color = 0xffffff;//光の色
                let intensity = 1.0;//光の強さ

                for (const property of obj.properties) {
                    if (property.name === 'radius' && property.value !== '') { radius = property.value; }
                    if (property.name === 'color' && property.value !== '') { color = property.value; }
                    if (property.name === 'intensity' && property.value !== '') { intensity = property.value; }
                }

                const light = this.fieldScene.lights.addLight(obj.x, obj.y, radius);
                light.setColor(color);
                light.setIntensity(intensity);

                const ellipse = new Phaser.Geom.Ellipse(obj.x, obj.y, 10, 10);

                this.timerEventObj = this.fieldScene.time.addEvent({
                    delay: 100,
                    callback: function () {
                        Phaser.Geom.Ellipse.Random(ellipse, light);
                    },
                    callbackScope: this,
                    repeat: -1
                });

                this.light.push(light);
                this.ellipse.push(ellipse);
            }

            if (this.debugFlg) {
                this.playerLight = this.fieldScene.lights.addLight(this.player.x, this.player.y, 200);
                this.playerLight.setIntensity(0.5);
                this.playerLightFlg = true;
            }

            this.fieldScene.lights.enable()
            this.fieldScene.lights.setAmbientColor(0xffffff);

            //タイルマップのプロパティからeffect情報を設定
            const makeTileMap: Phaser.Tilemaps.Tilemap = this.TileMap.getMakeTilemap();
            if (Array.isArray(makeTileMap.properties)) {
                for (const prop of makeTileMap.properties) {
                    if (prop.name === 'ambientColor') {
                        //環境光の色を設定
                        this.fieldScene.lights.setAmbientColor(prop.value);
                        //0xffffff
                        //0x222244
                    }
                }
            }
            resolve();
        });
    }


}