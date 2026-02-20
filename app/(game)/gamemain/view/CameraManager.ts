import { GameScene } from "../../lib/types";
import { Player } from "./character/Player";

export class CameraManager {
    private mainCamera: Phaser.Cameras.Scene2D.Camera;
    private player: Player;

    constructor(private gameScene: GameScene) {
        this.mainCamera = gameScene.cameras.main;
    }

    public execute(makeTilemap: Phaser.Tilemaps.Tilemap, player: Player,) {
        this.player = player;
        this.mainCamera.startFollow(this.player, true);//プレイヤーに追従
        this.mainCamera.setBounds(0, 0, makeTilemap.widthInPixels, makeTilemap.heightInPixels);//マップの最大値
    }

    public execFadeIn() {
        this.mainCamera.once('camerafadeincomplete', () => {
            this.gameScene.events.emit('FADE_IN_COMPLETE');
        });

         this.mainCamera.fadeIn(200);
    }

    public execFadeOut() {
        this.mainCamera.once('camerafadeoutcomplete', () => {
            this.gameScene.events.emit('FADE_OUT_COMPLETE');
        });

        this.mainCamera.fadeOut(400);
    }

    public setFollow(flg: boolean) {
        if (flg) {
            this.mainCamera.startFollow(this.player, true);//プレイヤーに追従
            this.mainCamera.useBounds = true;
        } else {
            this.mainCamera.stopFollow();
            this.mainCamera.useBounds = false;
        }
    }

    public getMainCamera(): Phaser.Cameras.Scene2D.Camera {
        return this.mainCamera;
    }
}