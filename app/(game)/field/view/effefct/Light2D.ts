import { FieldScene } from "@/app/(game)/lib/SceneTypes";
import { TileMap } from "@/app/(game)/field/view/TileMap";
import { Player } from "@/app/(game)/field/view/character/Player";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";
import { TiledLightObjectEntity } from "../Entity/TiledLightObjectEntity";

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

        this.lightObjectLayer = (makeTileMap.getObjectLayer('LIGHT')!);

        for (const tp of this.TileMap.getTilemapLayerList()) {
            tp.setPipeline('Light2D');
        }
        // for (const chestSpriteObject of this.chestSpriteObjects) {
        //     chestSpriteObject.setPipeline('Light2D');
        // }
    }

    public update(time: number, delta: number) {
        if (!this.playerLightFlg) return;
        this.playerLight.x = this.player.x;
        this.playerLight.y = this.player.y;
    }

    private createLight() {
        return new Promise<void>(async (resolve) => {

            this.fieldScene.lights.enable()
            const defaultAmbientColor = 0xffffff;
            //this.fieldScene.lights.setAmbientColor(0xffffff);//初期値

            //プレイヤーにライトを作成
            this.playerLight = this.fieldScene.lights.addLight(this.player.x, this.player.y, 200);
            this.playerLight.setIntensity(0.5);
            this.playerLightFlg = true;

            /**
             * lightオブジェクトは効果対象のオブジェクトが削除されればPhaserが自動で削除される
             */

            if (this.lightObjectLayer.objects) {
                for (const obj of this.lightObjectLayer.objects) {

                    //初期値
                    let radius = 200;//光の半径
                    let color = 0xffffff;//光の色
                    let intensity = 1.0;//光の強さ
                    let type = "";

                    //オブジェクト設定値を取得
                    const tiledLightObjectEntity = new TiledLightObjectEntity(obj.properties);
                    radius = tiledLightObjectEntity.radius;
                    color = Number(tiledLightObjectEntity.color);
                    intensity = tiledLightObjectEntity.intensity;
                    type = tiledLightObjectEntity.type;

                    const light = this.fieldScene.lights.addLight(obj.x, obj.y, radius);
                    light.setColor(color);
                    light.setIntensity(intensity);
                    //this.light.push(light);

                    if (type === 'fire') {
                        const ellipse = new Phaser.Geom.Ellipse(obj.x, obj.y, 10, 10);

                        this.timerEventObj = this.fieldScene.time.addEvent({
                            delay: 100,
                            callback: function () {
                                Phaser.Geom.Ellipse.Random(ellipse, light);
                            },
                            callbackScope: this,
                            repeat: -1
                        });
                        //this.ellipse.push(ellipse);
                    }

                    if (tiledLightObjectEntity.scrollX || tiledLightObjectEntity.scrollY) {
                        light.setScrollFactor(tiledLightObjectEntity.scrollX!, tiledLightObjectEntity.scrollY)
                    }
                }

                //タイルマップのプロパティからeffect情報を設定
                const ambientColor = this.TileMap.getTileMapPropatiesEntity().ambientColor === '' ? defaultAmbientColor : Number(this.TileMap.getTileMapPropatiesEntity().ambientColor);
                this.fieldScene.lights.setAmbientColor(ambientColor);
                //0xffffff
                //0x222244

                resolve();
            }
        });
    }


}