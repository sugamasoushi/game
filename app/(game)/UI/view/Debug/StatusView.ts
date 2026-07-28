import { FieldScene } from "../../../lib/SceneTypes";
import { GameStateManager } from "../../../core/GameStateManager";

export class StatusView {

    private fieldScene: FieldScene;
    private bgGraphics: Phaser.GameObjects.Graphics;
    private statusText: Phaser.GameObjects.Text;

    constructor(private uiScene: Phaser.Scene) {
        this.fieldScene = this.uiScene.scene.get('Field') as FieldScene;
    }

    public execute() {

        // 背景の黒塗り (透明度0.5) を左上に作成
        this.bgGraphics = this.uiScene.add.graphics();
        this.bgGraphics.fillStyle(0x000000, 0.7);
        this.bgGraphics.fillRect(10, 10, 300, 300);
        this.bgGraphics.setDepth(100);

        // キャラクター座標情報を表示するテキストを作成
        this.statusText = this.uiScene.add.text(20, 20, '', {
            fontSize: '24px',
            color: '#ffffff'
        });
        this.statusText.setDepth(101);
    }

    // 毎フレームの更新処理
    public update(time: number, delta: number) {
        void time;
        void delta;

        const gameStateManager = GameStateManager.getInstance();
        const meina = gameStateManager.currentPlayerPartyList[0];

        if (meina) {
            const x = Math.round(meina.x);
            const y = Math.round(meina.y);
            this.statusText.setText(`X: ${x}, Y: ${y}\ndepth: ${Math.floor(meina.depth)}`);
        } else {
            this.statusText.setText('');
        }
    }
}