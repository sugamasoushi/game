import { FieldScene } from "../../lib/SceneTypes";
import { TiledObjectEntity } from "./Entity/TiledObjectEntity";
import { InputManager } from "../../core/input/InputManager";
import { Npc } from "./character/Npc";
import { SpriteType_3x4 } from "./character/SpriteType_3x4";
import { SpriteType_4x4 } from "./character/SpriteType_4x4";
import { GameStateManager } from "../../core/GameStateManager";
import { TileMap } from "./TileMap";
import { EventFlagData } from "../../Data/EventFlagData";
import { SearchEnemyData } from '@/app/(game)/Data/SearchEnemyData';

export class NpcView {

    private npcEnemyList: Npc[] = [];
    private npcNormalList: Npc[] = [];

    constructor(
        private fieldScene: FieldScene,
        private tileMap: TileMap,
        private inputManager: InputManager,
    ) {
    }

    public update(time: number, delta: number) {
        void time;
        void delta;
    }

    public async execute() {
        this.createNPC();
    }

    private createNPC() {
        return new Promise<void>(async (resolve) => {
            const gameStateManager = GameStateManager.getInstance();

            //NPC作成
            if (this.tileMap.getMakeTilemap().objects) {
                for (const makeTilemapObj of this.tileMap.getMakeTilemap().objects) {
                    if (makeTilemapObj.name === 'NPC') {
                        for (const npcObj of makeTilemapObj.objects) {

                            try {
                                const entity = new TiledObjectEntity(npcObj.properties);

                                //イベント関連の敵の場合、イベントフラグが立ってなければ作成しない
                                if (entity.createJudgeEventKey) {
                                    if (!EventFlagData.getFlag(this.fieldScene, entity.createJudgeEventKey)) {
                                        resolve();
                                        return;
                                    }
                                }

                                //吹き出し会話の設定
                                let bubbleTalkKey = entity.bubbleTalkDefaultKey;
                                if (entity.bubbleJugeEventKey) {
                                    //イベントが完了していた場合のセリフを設定
                                    if (!EventFlagData.getFlag(this.fieldScene, entity.bubbleJugeEventKey)) {
                                        bubbleTalkKey = entity.bubbleTalkKeyEventOff;
                                    }
                                }

                                //登録済みデータが指定されている場合
                                if (entity.enemyData) {
                                    const searchEnemyData = new SearchEnemyData(this.fieldScene.cache.json)
                                    const enemyData = searchEnemyData.getEnemyData(entity.enemyData)

                                    const npc = this.createSprite(
                                        'enemy', //npcType : npcのタイプ
                                        enemyData!.SpriteType, //spritetype : spriteのタイプ
                                        this.fieldScene,
                                        npcObj.x!,
                                        npcObj.y!,
                                        enemyData!.SpritesheetKey, //spriteSheetKey : タイル画像のキー
                                        enemyData!.SpritesheetKeyOrder,//spritesheetKeyOrder : タイル画像の方向を示す順序
                                        'slime', //name : ゲーム内変数としてのキャラ名、画像などで使用
                                        '', //指定されていなければ下向き配置
                                        enemyData!.ImageKey, //imageKey : 立ち絵のキー、アイコンにも使用
                                        bubbleTalkKey //指定されていれば吹き出し会話を設定する。「bubbleTalk0000.talk000」
                                    );

                                    npc!.setMakeTilemapData(this.tileMap.getMakeTilemap());
                                    npc!.setCollisionLayer(this.tileMap.getCollisionLayer());

                                    npc!.init();

                                    npc!.setVisible(entity.isVisible);

                                    if (entity.scale) { npc!.setScale(entity.scale); }

                                    if (entity.npcType === 'normal') {
                                        this.npcNormalList.push(npc as Npc);
                                    } else {
                                        this.npcEnemyList.push(npc as Npc);
                                    }

                                    if (this.tileMap.getCollisionLayer()) {
                                        this.fieldScene.physics.add.collider(npc as Phaser.Physics.Arcade.Sprite, this.tileMap.getCollisionLayer());
                                    }

                                    for (const player of gameStateManager.currentPlayerPartyList) {
                                        this.fieldScene.physics.add.collider(npc!, player);
                                    }

                                    npc!.setInputManager(this.inputManager);

                                    this.fieldScene.events.on('shutdown', () => {
                                        npc!.destroy();
                                    });

                                } else {

                                    const npc = this.createSprite(
                                        entity.npcType, //npcType : npcのタイプ
                                        entity.spriteType, //spritetype : spriteのタイプ
                                        this.fieldScene,
                                        npcObj.x!,
                                        npcObj.y!,
                                        entity.spritesheetKey, //spriteSheetKey : タイル画像のキー
                                        entity.spritesheetKeyOrder,//spritesheetKeyOrder : タイル画像の方向を示す順序
                                        entity.name, //name : ゲーム内変数としてのキャラ名、画像などで使用
                                        entity.standkey, //指定されていなければ下向き配置
                                        entity.imageKey, //imageKey : 立ち絵のキー、アイコンにも使用
                                        bubbleTalkKey //指定されていれば吹き出し会話を設定する。「bubbleTalk0000.talk000」
                                    );

                                    npc!.setMakeTilemapData(this.tileMap.getMakeTilemap());
                                    npc!.setCollisionLayer(this.tileMap.getCollisionLayer());

                                    npc!.init();

                                    npc!.setVisible(entity.isVisible);

                                    if (entity.scale) { npc!.setScale(entity.scale); }

                                    if (entity.npcType === 'normal') {
                                        this.npcNormalList.push(npc as Npc);
                                    } else {
                                        this.npcEnemyList.push(npc as Npc);
                                    }

                                    if (this.tileMap.getCollisionLayer()) {
                                        this.fieldScene.physics.add.collider(npc as Phaser.Physics.Arcade.Sprite, this.tileMap.getCollisionLayer());
                                    }

                                    for (const player of gameStateManager.currentPlayerPartyList) {
                                        this.fieldScene.physics.add.collider(npc!, player);
                                    }

                                    npc!.setInputManager(this.inputManager);

                                    this.fieldScene.events.on('shutdown', () => {
                                        npc!.destroy();
                                    });
                                }

                            } catch (e) {
                                console.log('NPC作成エラー')
                                console.log(npcObj, e)
                            }
                        }
                    }
                }
            }

            // 状態管理クラスのパーティリストを更新
            gameStateManager.setFieldNpcList(this.npcNormalList);
            gameStateManager.setFieldEnemyList(this.npcEnemyList);

            resolve();
        });
    }

    public createSprite(
        npcType: string,
        spritetype: string,
        gameScene: FieldScene,
        x: number,
        y: number,
        spriteSheetKey: string,
        spritesheetKeyOrder: string,
        name: string,
        initStandKey: string,
        imageKey: string,
        bubbleTalkKey: string) {

        if (spritetype === '0404') {
            return new SpriteType_4x4(gameScene, x, y, npcType, spriteSheetKey, spritesheetKeyOrder, name, initStandKey, imageKey, bubbleTalkKey);
        }

        if (spritetype === '0304') {
            return new SpriteType_3x4(gameScene, x, y, npcType, spriteSheetKey, spritesheetKeyOrder, name, initStandKey, imageKey, bubbleTalkKey);
        }
    }

}