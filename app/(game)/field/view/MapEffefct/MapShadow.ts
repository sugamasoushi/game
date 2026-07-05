import { FieldScene } from "@/app/(game)/lib/SceneTypes";
import { TileMap } from "@/app/(game)/field/view/TileMap";
import { MapLayerDepth } from "@/app/(game)/lib/FieldTypes";

export class MapShadow {

    private highestMapRenderTexture: Phaser.GameObjects.RenderTexture | null = null;

    constructor(private fieldScene: FieldScene, private tileMap: TileMap) { }

    public async execute() {
        await this.createMapShadow();
    }

    private createMapShadow() {
        return new Promise<void>(resolve => {

            // 背景専用のRenderTexture（絶対にクリアしない、マップ情報保持用）
            if (this.fieldScene.textures.exists('HighestMap_captured_image')) { this.fieldScene.textures.removeKey('HighestMap_captured_image'); }

            const width = this.tileMap.getMakeTilemap().widthInPixels;
            const height = this.tileMap.getMakeTilemap().heightInPixels;


            this.highestMapRenderTexture = this.fieldScene.add.renderTexture(width / 2, height / 2 + 64, width, height);

            for (const tilemapLayer of this.tileMap.getMapHighestLayerList()) {

                tilemapLayer.setTint(0x000000); // レイヤーを一瞬真っ黒にする

                this.highestMapRenderTexture.draw(tilemapLayer, 1, 1);

                // 元の色に戻す
                //tilemapLayer.clearAlpha();
                tilemapLayer.setTint(0xffffff);
            }

            this.highestMapRenderTexture.saveTexture('HighestMap_captured_image');
            this.highestMapRenderTexture.setDepth(height + MapLayerDepth.Highest - 10).setAlpha(0.5);

            this.fieldScene.events.on('shutdown', () => {
                this.highestMapRenderTexture!.destroy();
                resolve();
            });

            resolve();
        });
    }

}