import { FieldScene } from "../../lib/types";
import { Player } from "./character/Player";
import { GameStateManager } from "../../core/GameStateManager";
import SunrayPostPipeline from "./cameraeffect/SunrayPostPipeline";
import { TiledMapPropatiesEntity } from './character/TiledMapEntity';

export class CameraManager {
    // カメラオブジェクトがシーンから切り離されている場合があるため
    // 安全に main camera を取得すること
    // private mainCamera: Phaser.Cameras.Scene2D.Camera;

    private player: Player;
    private makeTilemap: Phaser.Tilemaps.Tilemap;
    private tiledMapPropatiesEntity: TiledMapPropatiesEntity;

    constructor(private fieldScene: FieldScene) { }

    public execute(makeTilemap: Phaser.Tilemaps.Tilemap) {
        const mainCamera = this.fieldScene.cameras.main;
        this.makeTilemap = makeTilemap;
        const gameStateManager = GameStateManager.getInstance();
        this.player = gameStateManager.currentPlayerPartyList[0] as Player;

        mainCamera.startFollow(this.player, true);//プレイヤーに追従
        mainCamera.setBounds(-64, -64, makeTilemap.widthInPixels + 128, makeTilemap.heightInPixels + 128);//マップの最大値
    }

    public execFadeInStart() {
        this.fieldScene.events.emit('FADE_IN_START');
    }

    public execFadeIn() {
        const mainCamera = this.fieldScene.cameras.main;
        mainCamera.once('camerafadeincomplete', () => {
            this.fieldScene.events.emit('FADE_IN_COMPLETE');
        });

        mainCamera.fadeIn(200);
    }

    public execFadeOut() {
        return new Promise<void>(resolve => {
            const mainCamera = this.fieldScene.cameras.main;
            mainCamera.once('camerafadeoutcomplete', () => {
                resolve();
            });

            mainCamera.fadeOut(200);
            this.fieldScene.events.emit('FADE_OUT_START');
        });
    }

    public setFollow(flg: boolean) {
        const mainCamera = this.fieldScene.cameras.main;
        if (flg) {
            mainCamera.startFollow(this.player, true);//プレイヤーに追従
            mainCamera.useBounds = true;
        } else {
            mainCamera.stopFollow();
            mainCamera.useBounds = false;
        }
    }

    public setTiledMapPropatiesEntity(tiledMapPropatiesEntity: TiledMapPropatiesEntity) {
        this.tiledMapPropatiesEntity = tiledMapPropatiesEntity;
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera { return this.fieldScene.cameras.main; }

    public execCameraEffect() {

        const mainCamera = this.fieldScene.cameras.main;

        if (mainCamera.postFX) {

            mainCamera.postFX.clear();

            // カラーマトリックスエフェクトをカメラに追加
            const cameraFilter = mainCamera.postFX.addColorMatrix();

            // 【調整例A】コントラストを高めて、陰影をクッキリさせる
            cameraFilter.contrast(0.5);      // 1.0が基準。1.4でかなりクッキリします

            // 【調整例B】全体を少し暗くして、ライトの光（懐中電灯など）を引き立たせる
            cameraFilter.brightness(-0.2);   // 0.0が基準。-0.1でほんのりダークに

            // 【調整例C】彩度を少し下げて、ドット絵のギラギラ感を抑えトーンを馴染ませる
            cameraFilter.saturate(0.5);     // 1.0が基準。0.85で少し渋い色合いに

            //cameraFilter.hue(180);
        }

        if (this.tiledMapPropatiesEntity && this.tiledMapPropatiesEntity.CameraEffect) {
            switch (this.tiledMapPropatiesEntity.CameraEffect) {
                case 'Sunray':
                    this.execSunray();
                    break;
            }
        }
    }

    public cameraBlur() {

        // ぼかしを実行する際、カメラオブジェクトがシーンから切り離されている場合があるため
        // 安全に main camera を取得してから postFX を呼び出す

        try {
            this.fieldScene.cameras.main.postFX.addBlur(2, 1, 1, 1, 0xffffff, 1);
        } catch (e) {
            // Phaser の内部で camera.scene が null などの例外が出る可能性があるため安全にハンドル
            // 実行失敗は警告として残す
            console.warn('cameraBlur failed:', e);
        }
    }

    private execSunray() {

        const renderer = this.fieldScene.game.renderer as Phaser.Renderer.WebGL.WebGLRenderer;

        renderer.pipelines.addPostPipeline(
            'SunrayPost',
            SunrayPostPipeline
        );
        this.fieldScene.cameras.main.setPostPipeline('SunrayPost');

        const sunray =
            this.fieldScene.cameras.main.getPostPipeline(
                'SunrayPost'
            ) as SunrayPostPipeline;

        // 左上から差し込む光（座標原点は画面中心のため負の値で左上へ移動）
        // sunray.density = 25.0;
        // sunray.speed = 0.3;
        //sunray.rayDirection.set(-1, -1).normalize();
        sunray.rayColor.setTo(255, 245, 200);

    }
}