import { FieldScene } from "../../lib/SceneTypes";
import { MapLayerDepth } from '@/app/(game)/lib/FieldTypes';

export class TreeView {

    private treeGlassSprites: Phaser.Physics.Arcade.Sprite[] = [];
    private treeStemSprites: Phaser.Physics.Arcade.Sprite[] = [];

    constructor(
        private fieldScene: FieldScene) {
    }

    public update(time: number, delta: number) {
        void time;
        void delta;

        for (const obj of this.treeStemSprites) {
            //根本を基準
            obj.setDepth(MapLayerDepth.High + obj.y + (obj.height / 2 - 24))
        }
    }

    public async execute(makeTileMap: Phaser.Tilemaps.Tilemap) {

        // オブジェクトレイヤーの存在チェックを行い、警告を回避する
        let treeGlassSpriteObjects: Phaser.GameObjects.GameObject[] = [];
        let treeStemSpriteObjects: Phaser.GameObjects.GameObject[] = [];

        if (makeTileMap.getObjectLayer('SPRITE')) {
            treeGlassSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
                name: 'tree_glass',
                key: 'tex_tree_glass'
            });
            treeStemSpriteObjects = makeTileMap.createFromObjects('SPRITE', {
                name: 'tree_stem',
                key: 'tex_tree_stem'
            });
        }

        //静的オブジェクトの子要素を取得
        const treeGlassSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.fieldScene.physics.add.staticGroup(treeGlassSpriteObjects).getChildren();
        const treeStemSpriteObjectStaticGroupChildren: Phaser.GameObjects.GameObject[] = this.fieldScene.physics.add.staticGroup(treeStemSpriteObjects).getChildren();

        for (const obj of treeGlassSpriteObjectStaticGroupChildren) {
            await this.settingTreeGlassSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
        }
        for (const obj of treeStemSpriteObjectStaticGroupChildren) {
            this.settingTreeStemSpriteObjects(obj as Phaser.Physics.Arcade.Sprite);
        }

        this.fieldScene.events.once('shutdown', () => {
            for (const obj of this.treeGlassSprites) { obj.destroy() }
            for (const obj of this.treeStemSprites) { obj.destroy() }
        })
    }

    private settingTreeGlassSpriteObjects(obj: Phaser.Physics.Arcade.Sprite) {
        return new Promise<void>(async (resolve) => {
            obj.setDepth(9999999999999);
            obj.setOrigin(0.5, 1);
            obj.setPosition(obj.x, obj.y + 96 / 2);

            // 風で揺れるTweenアニメーションを作成
            this.fieldScene.tweens.add({
                targets: obj,
                angle: { from: -2, to: 2 },
                ease: 'sine.easeInOut',
                duration: 2000,
                yoyo: true,
                repeat: -1,
                delay: Phaser.Math.Between(0, 2000)
            });

            this.treeGlassSprites.push(obj);
            resolve();
        });
    }

    private settingTreeStemSpriteObjects(obj: Phaser.Physics.Arcade.Sprite) {
        obj.setDepth(obj.y);
        this.treeStemSprites.push(obj);
    }
}
