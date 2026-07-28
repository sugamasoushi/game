import { FieldScene } from "../../../lib/SceneTypes";

// Record で扱えるよう、MapKeys をトップレベルの定数に移動
const cameraEffectKeys = [
    'DeleteEffect', 'NormalEffect', 'SunrayPost', 'PlasmaPostFX', 'PlasmaPost2FX', 'Swirl',
    'BendPostFX', 'BlurPostFX', 'HueRotatePostFX', 'LazersPostFX', 'MultiColorPostFX', 'PixelatedFX', 'ScalinePostFX',
    'BendRotationWavesPostFX'
] as const;

// 型定義：MapKeysの中のいずれかの文字列、という意味の型になります
type CameraEffectKey = typeof cameraEffectKeys[number];

export class CameraTestButton {
    private fieldScene: FieldScene;

    private currentIndex = 1;//デフォルト

    constructor(private uiScene: Phaser.Scene) {
        this.fieldScene = this.uiScene.scene.get('Field') as FieldScene;
    }

    public execute() {
        const textHeight = 200;
        const leftButton = this.uiScene.add.text(20, textHeight, '◀', {
            fontSize: '24px',
            color: '#ffffff'
        });
        leftButton.setDepth(101).setInteractive({ useHandCursor: true });

        const testButton = this.uiScene.add.text(50, textHeight, cameraEffectKeys[this.currentIndex], {
            fontSize: '24px',
            color: '#ffffff'
        });
        testButton.setDepth(101).setInteractive({ useHandCursor: true });

        const rightButton = this.uiScene.add.text(230, textHeight, '▶', {
            fontSize: '24px',
            color: '#ffffff'
        });
        rightButton.setDepth(101).setInteractive({ useHandCursor: true });

        leftButton.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (pointer.rightButtonReleased()) return;
            this.currentIndex = (this.currentIndex - 1 + cameraEffectKeys.length) % cameraEffectKeys.length;
            testButton.setText(cameraEffectKeys[this.currentIndex]);
        });

        rightButton.on(Phaser.Input.Events.POINTER_UP, (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {
            event.stopPropagation();
            if (pointer.rightButtonReleased()) return;
            this.currentIndex = (this.currentIndex + 1) % cameraEffectKeys.length;
            testButton.setText(cameraEffectKeys[this.currentIndex]);
        });

        testButton.on(Phaser.Input.Events.POINTER_UP, async (pointer: Phaser.Input.Pointer, localX: number, localY: number, event: Phaser.Types.Input.EventData) => {

            //下層のオブジェクトのイベントを止める
            event.stopPropagation();

            //右クリックの場合は処理しない
            if (pointer.rightButtonReleased()) return;

            //イベントごとの設定
            this.setMap(cameraEffectKeys[this.currentIndex]);
        })
    }

    private setMap(cameraEffectKeys: CameraEffectKey) {

        const handler = this.eventHandlers[cameraEffectKeys];
        if (handler) {
            handler(cameraEffectKeys);
        }
    }

    private readonly eventHandlers: Record<CameraEffectKey, (key: CameraEffectKey) => void> = {
        'DeleteEffect': () => {
            const cameraManager = this.fieldScene.getCameraManagerInstance(); const mainCamera = cameraManager.getMainCamera();
            //カメラにかかっているエフェクトをクリア
            mainCamera.postFX.clear();
        },
        'NormalEffect': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.normalEffect(); },
        'SunrayPost': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execSunray(); },
        'PlasmaPostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execPlasmaPostFX(); },
        'PlasmaPost2FX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execPlasmaPost2FX(); },
        'Swirl': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execSwirl(); },
        'BendPostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execBendPostFX(); },
        'BlurPostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execBlurPostFX(); },
        'HueRotatePostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execHueRotatePostFX(); },
        'LazersPostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execLazersPostFX(); },
        'MultiColorPostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execMultiColorPostFX(); },
        'PixelatedFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execPixelatedFX(); },
        'ScalinePostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execScalinePostFX(); },
        'BendRotationWavesPostFX': () => { const cameraManager = this.fieldScene.getCameraManagerInstance(); cameraManager.execBendRotationWavesPostFX(); }
    };
}