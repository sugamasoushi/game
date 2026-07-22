import { FieldScene } from "../../lib/SceneTypes";
import { TiledObjectEntity } from "./Entity/TiledObjectEntity";
import { Npc } from "./character/Npc";
import { GameStateManager } from "../../core/GameStateManager";
import { EventFlagData } from "../../Data/EventFlagData";
import { SearchEnemyData } from '@/app/(game)/Data/SearchEnemyData';
import { createNPC } from "../../util/CreateNPC";

export class NpcView {
    private npcEnemyList: Npc[] = [];
    private npcNormalList: Npc[] = [];

    constructor(private fieldScene: FieldScene) { }

    public update(time: number, delta: number) { void time; void delta; }

    public async execute() { this.createNPC(); }

    private createNPC() {
        return new Promise<void>(async (resolve) => {
            const gameStateManager = GameStateManager.getInstance();
            const tileMap = this.fieldScene.getTileMapInstance();

            //NPC作成
            if (tileMap.getMakeTilemap().objects) {
                for (const makeTilemapObj of tileMap.getMakeTilemap().objects) {
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

                                //吹き出し会話（初期値）の設定
                                let bubbleTalkKey = entity.bubbleTalkDefaultKey;

                                //吹き出し会話（指定イベント後）を設定
                                if (entity.bubbleJugeEventKey) {
                                    //イベントが完了していた場合のセリフを設定
                                    if (!EventFlagData.getFlag(this.fieldScene, entity.bubbleJugeEventKey)) {
                                        bubbleTalkKey = entity.bubbleTalkKeyEventOff;
                                    }
                                }

                                //NPCパラメータの準備
                                let npcType: string;//npcType : npcのタイプ
                                let spritetype: string;//spritetype : spriteのタイプ
                                let spriteSheetKey: string;//spriteSheetKey : タイル画像のキー
                                let spritesheetKeyOrder: string;//spritesheetKeyOrder : タイル画像の方向を示す順序
                                let name: string;//name : ゲーム内変数としてのキャラ名、画像などで使用
                                let initStandKey: string;//指定されていなければ下向き配置
                                let imageKey: string;//imageKey : 立ち絵のキー、アイコンにも使用

                                if (entity.enemyData) {
                                    const searchEnemyData = new SearchEnemyData(this.fieldScene.cache.json);
                                    const enemyData = searchEnemyData.getEnemyData(entity.enemyData);

                                    npcType = 'enemy';
                                    spritetype = enemyData!.SpriteType;
                                    spriteSheetKey = enemyData!.SpritesheetKey;
                                    spritesheetKeyOrder = enemyData!.SpritesheetKeyOrder;
                                    name = enemyData!.Name;
                                    initStandKey = 'down';
                                    imageKey = enemyData!.ImageKey;

                                } else {
                                    npcType = entity.npcType;
                                    spritetype = entity.spriteType;
                                    spriteSheetKey = entity.spritesheetKey;
                                    spritesheetKeyOrder = entity.spritesheetKeyOrder;
                                    name = entity.name;
                                    initStandKey = entity.standkey;
                                    imageKey = entity.imageKey;
                                }

                                const npc = createNPC(
                                    spritetype,
                                    spriteSheetKey,
                                    spritesheetKeyOrder,
                                    this.fieldScene,
                                    npcObj.x!,
                                    npcObj.y!,
                                    npcType,
                                    imageKey
                                );

                                //存在チェック
                                if (!npc) continue;

                                /**
                                 * NPC設定
                                 */

                                npc.setVisible(entity.isVisible);
                                if (name) { npc.name = name };
                                if (entity.scale) { npc.setScale(entity.scale); }
                                if (bubbleTalkKey) { npc.setBubbleTalk(bubbleTalkKey) }
                                if (initStandKey === 'right') { npc.setStandFrame(npc.getStandKey('right')); }
                                else if (initStandKey === 'left') { npc.setStandFrame(npc.getStandKey('left')); }
                                else if (initStandKey === 'up') { npc.setStandFrame(npc.getStandKey('up')); }
                                else if (initStandKey === 'down') { npc.setStandFrame(npc.getStandKey('down')); }

                                //物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
                                this.fieldScene.physics.add.existing(npc);

                                //Body の不動プロパティを設定、物理演算されなくなる。
                                (npc.body as Phaser.Physics.Arcade.Body)!.setImmovable(true);

                                //敵キャラクターの場合はステータスを設定
                                if (entity.enemyData || entity.npcType === 'enemy') {
                                    const searchEnemyData = new SearchEnemyData(this.fieldScene.cache.json);
                                    const imageKey = npc.getData('ImageKey');
                                    const enemyData = searchEnemyData.getEnemyData(imageKey);

                                    if (enemyData) {
                                        npc.setData({
                                            level: enemyData.Level,
                                            HP: enemyData.HP,
                                            MP: enemyData.MP,
                                            MaxHP: enemyData.MaxHP,
                                            MaxMP: enemyData.MaxMP,
                                            Attack: enemyData.Attack,
                                            Guard: enemyData.Guard,
                                            Speed: enemyData.Speed,
                                            gold: enemyData.gold
                                        });
                                        npc.setData('name', enemyData.Name);
                                    }

                                    const player = GameStateManager.getInstance().currentPlayerPartyList[0];

                                    //オブジェクトに衝突した場合、戦闘を発生させる
                                    this.fieldScene.physics.add.world.addCollider(npc, player, () => {
                                        //Presenterに通知
                                        this.fieldScene.events.emit('BATTLE', { usePatern: 'normal', fieldHitEnemy: npc, canNotRunaway: false });
                                    }, undefined, this.fieldScene);
                                }

                                //衝突判定の設定
                                if (tileMap.getCollisionLayer()) { this.fieldScene.physics.add.collider(npc as Phaser.Physics.Arcade.Sprite, tileMap.getCollisionLayer()); }
                                for (const player of gameStateManager.currentPlayerPartyList) { this.fieldScene.physics.add.collider(npc, player); }

                                if (entity.npcType === 'normal') {
                                    this.npcNormalList.push(npc as Npc);
                                } else {
                                    this.npcEnemyList.push(npc as Npc);
                                }
                                this.fieldScene.events.once('shutdown', () => { npc.destroy(); });

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

    private setupNpc() {

    }
}