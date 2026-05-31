import { FieldScene } from "../../lib/types";
import { Player } from "./character/Player";
import { GameStateManager } from "../../core/GameStateManager";

export class CameraManager {
    private mainCamera: Phaser.Cameras.Scene2D.Camera;
    private player: Player;

    constructor(private fieldScene: FieldScene) {
        this.mainCamera = fieldScene.cameras.main;
    }

    public execute(makeTilemap: Phaser.Tilemaps.Tilemap) {
        const gameStateManager = GameStateManager.getInstance();
        this.player = gameStateManager.currentPlayerPartyList[0] as Player;

        this.mainCamera.startFollow(this.player, true);//プレイヤーに追従
        this.mainCamera.setBounds(-64, -64, makeTilemap.widthInPixels + 128, makeTilemap.heightInPixels + 128);//マップの最大値
    }

    public execFadeInStart() {
        this.fieldScene.events.emit('FADE_IN_START');
    }

    public execFadeIn() {
        this.mainCamera.once('camerafadeincomplete', () => {
            this.fieldScene.events.emit('FADE_IN_COMPLETE');
        });

        this.mainCamera.fadeIn(200);
    }

    public execFadeOut() {
        return new Promise<void>(resolve => {
            this.mainCamera.once('camerafadeoutcomplete', () => {
                resolve();
            });

            this.mainCamera.fadeOut(200);
            this.fieldScene.events.emit('FADE_OUT_START');
        });
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