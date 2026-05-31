import { FieldScene } from "@/app/(game)/lib/SceneTypes";
import { TileMap } from "@/app/(game)/field/view/TileMap";
import { Npc } from "@/app/(game)/field/view/character/Npc";
import { GameStateManager } from "@/app/(game)/core/GameStateManager";

export class BgRenderTexture {

    private playerPartyList: Phaser.Physics.Arcade.Sprite[] = [];
    private npcNormalList: Npc[] = [];
    private npcEnemyList: Npc[] = [];

    private renderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private bgRenderTexture: Phaser.GameObjects.RenderTexture | null = null;
    private renderTextureUpdateFlg: boolean = false;

    constructor(private fieldScene: FieldScene, private tileMap: TileMap) { }

    public async execute() {

        // リストを初期化
        const gameStateManager = GameStateManager.getInstance();
        this.playerPartyList = gameStateManager.currentPlayerPartyList as Phaser.Physics.Arcade.Sprite[];

        await this.createBgRenderTexture();
        await this.createCharacterRendertexture();
    }

    public update(time: number, delta: number) {
        this.updateRenderTexture();
    }

    /**
     * マップ全体のテクスチャの生成、水面反射やマスク等に使用する。
     */
    private createBgRenderTexture() {
        return new Promise<void>(resolve => {

            // 背景専用のRenderTexture（絶対にクリアしない、マップ情報保持用）
            if (this.fieldScene.textures.exists('bg_captured_image')) { this.fieldScene.textures.removeKey('bg_captured_image'); }

            const width = this.tileMap.getMakeTilemap().widthInPixels;
            const height = this.tileMap.getMakeTilemap().heightInPixels;

            this.bgRenderTexture = this.fieldScene.add.renderTexture(0, 0, width, height);
            for (const tilemapLayer of this.tileMap.getWaterSrufaceSubjectTilemapLayerList()) {
                this.bgRenderTexture.draw(tilemapLayer);
            }
            this.bgRenderTexture.saveTexture('bg_captured_image');
            this.bgRenderTexture.setVisible(false);

            resolve();
        });
    }

    private createCharacterRendertexture(): Promise<void> {

        /**
         * キャラクター専用のテクスチャの生成、水面反射やマスク等に使用する。
         */

        return new Promise<void>(resolve => {

            const width = this.tileMap.getMakeTilemap().widthInPixels;
            const height = this.tileMap.getMakeTilemap().heightInPixels;

            // 1. 【超重要】すでに古い RenderTexture やテクスチャキーが存在している場合は、完全に破棄・消去する
            if (this.renderTexture) {
                this.renderTexture.destroy(); // 既存のオブジェクトを破棄
                this.renderTexture = null;
            }

            // Phaserのテクスチャマネージャー内から古いキー名自体を消去する
            if (this.fieldScene.textures.exists('char_captured_image')) { this.fieldScene.textures.removeKey('char_captured_image'); }

            // 2. 毎フレーム更新・シェーダー渡し用のメインRenderTexture
            this.renderTexture = this.fieldScene.add.renderTexture(0, 0, width, height);

            // 初回の描画 (背景は描画せず、キャラクターのみを上下反転させて描画)
            // const originalScaleY = this.player.scaleY;
            // this.player.scaleY *= -1; // 上下反転

            // // 足元で反射が繋がるように、Y座標をキャラの高さ分下にズラして描画
            // this.renderTexture.draw(this.player, this.player.x, this.player.y + this.player.displayHeight);

            // this.player.scaleY = originalScaleY; // 元に戻す



            for (const player of this.playerPartyList) {
                const originalScaleY = player.scaleY;
                player.scaleY *= -1; // 上下反転
                this.renderTexture.draw(player, player.x, player.y + player.displayHeight);
                player.scaleY = originalScaleY; // 元に戻す
            }

            for (const npc of this.npcNormalList) {
                if (npc.visible) {
                    const originalScaleY = npc.scaleY;
                    npc.scaleY *= -1; // 上下反転
                    this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                    npc.scaleY = originalScaleY; // 元に戻す
                }
            }

            for (const npc of this.npcEnemyList) {
                if (npc.visible) {
                    const originalScaleY = npc.scaleY;
                    npc.scaleY *= -1; // 上下反転
                    this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                    npc.scaleY = originalScaleY; // 元に戻す
                }
            }

            // この画像キーでシェーダーがキャラクターのテクスチャを参照します
            this.renderTexture.saveTexture('char_captured_image');
            this.renderTexture.setVisible(false);

            this.renderTextureUpdateFlg = true;

            resolve();
        });
    }

    public updateRenderTexture() {
        if (!this.renderTextureUpdateFlg || !this.renderTexture || !this.bgRenderTexture) return;

        // 1. メインのRenderTextureをクリア（前回のプレイヤーの軌跡を完全に消す）
        this.renderTexture.clear();

        // 2. 静的な背景は別のテクスチャとして渡すため、ここでは描画しない

        // 3. 最新の座標でプレイヤーを上下反転させて描画
        // const originalScaleY = this.player.scaleY;
        // this.player.scaleY *= -1; // 上下反転

        // // 足元で反射が繋がるように、Y座標をキャラの高さ分下にズラして描画
        // this.renderTexture.draw(this.player, this.player.x, this.player.y + this.player.displayHeight);

        // this.player.scaleY = originalScaleY; // 元に戻す


        for (const player of this.playerPartyList) {
            const originalScaleY = player.scaleY;
            player.scaleY *= -1; // 上下反転
            this.renderTexture.draw(player, player.x, player.y + player.displayHeight);
            player.scaleY = originalScaleY; // 元に戻す
        }

        for (const npc of this.npcNormalList) {
            if (npc.visible) {
                const originalScaleY = npc.scaleY;
                npc.scaleY *= -1; // 上下反転
                this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                npc.scaleY = originalScaleY; // 元に戻す
            }
        }

        for (const npc of this.npcEnemyList) {
            if (npc.visible) {
                const originalScaleY = npc.scaleY;
                npc.scaleY *= -1; // 上下反転
                this.renderTexture.draw(npc, npc.x, npc.y + npc.displayHeight);
                npc.scaleY = originalScaleY; // 元に戻す
            }
        }
    }
}