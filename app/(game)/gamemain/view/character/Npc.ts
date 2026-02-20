import { GameScene, CharacterState } from "@/app/(game)/lib/types";
import { BaseSprite } from "@/app/(game)/core/BaseSprite";
import { FieldObjectCheck } from "@/app/(game)/util/FieldObjectCheck";
import { BubbleTalk } from './Action/BubbleTalk';

export class Npc extends BaseSprite {
    private npcType: string;
    protected bubbleTalkKey;

    protected spriteObjList: Phaser.Physics.Arcade.Sprite[] = [];
    private graphicsObjList: Phaser.GameObjects.Graphics[] = [];
    private energyGauge: Phaser.GameObjects.Graphics;
    private energyGaugeBack: Phaser.GameObjects.Graphics;

    private delay: number;

    private deleteDelay = 30;

    public body: Phaser.Physics.Arcade.Body

    constructor(gameScene: GameScene, x: number, y: number, npcType: string, spriteSheetKey: string, npcNameCode: string, initStandKey: string, imageKey: string, bubbleTalkKey: string) {
        super(gameScene, x, y, spriteSheetKey, initStandKey);
        this.gameScene = gameScene;
        this.npcType = npcType;
        this.state = CharacterState.normal;
        if (npcType === 'event') {
            this.state = CharacterState.event;
        }
        this.name = npcNameCode;
        this.bubbleTalkKey = bubbleTalkKey;

        this.setData('NpcType', npcType)
        this.setData('ImageKey', imageKey)
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.y + (32 / 2) * this.scale);
        this.updateRandomMoveToPosition();
        this._setInput();
        this.energyHP();
        this.delete();
    }

    init() {
        this.scene.physics.add.existing(this);//物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
        (this.body as Phaser.Physics.Arcade.Body)!.setImmovable(true);//Body の不動プロパティを設定、物理演算されなくなる。
        //不動についてはbody.setPushable(false);というのもあるらしい
        this._collideSetting();
        this.statusSetting();
        this.talkSetting();
    };

    private energyHP() {
        if (this.npcType !== 'enemy') return;

        //初回作成時
        if (!this.energyGauge) {
            this.energyGauge = this.gameScene.add.graphics();
            this.energyGauge.name = 'energyGauge';
            this.energyGaugeBack = this.gameScene.add.graphics();
            this.energyGaugeBack.name = 'energyGaugeBack'
            this.graphicsObjList.push(this.energyGauge);
            this.graphicsObjList.push(this.energyGaugeBack);
        };
        this.energyGauge.setDepth(this.depth);
        this.energyGauge.clear();//再描画のためクリア
        this.energyGaugeBack.setDepth(this.depth - 1);
        this.energyGaugeBack.clear();//再描画のためクリア

        const rectR = 4;//角の丸みの半径
        const maxWidth = 40 + rectR * 2;
        const height = 4 + rectR * 2;

        const width = maxWidth * this.getData("HP") / this.getData("MaxHP");
        //console.log(this.getData("HP") / this.getData("MaxHP") * 100);

        this.energyGauge.x = this.x - maxWidth / 2 + rectR;//座標初期値を設定テキストの左上
        this.energyGauge.y = this.y - 30;
        this.energyGaugeBack.x = this.x - maxWidth / 2 + rectR;
        this.energyGaugeBack.y = this.y - 30;

        this.energyGaugeBack.fillStyle(0x000000, 1);

        if (this.getData("HP") / this.getData("MaxHP") <= 4 / 10) {
            this.energyGauge.fillStyle(0xdc143c, 1);
        } else {
            this.energyGauge.fillStyle(0x3cb371, 1);
        }

        this.energyGauge.lineStyle(2, 0x000000);

        this.energyGaugeBack.fillRoundedRect(-1 * rectR, -1 * rectR, maxWidth, height, rectR);
        this.energyGauge.fillRoundedRect(-1 * rectR, -1 * rectR, width, height, rectR);
        this.energyGauge.strokeRoundedRect(-1 * rectR, -1 * rectR, maxWidth, height, rectR);
    }

    private statusSetting() {
        if (this.npcType === 'enemy') {

            //ダミーデータ
            this.setData({
                level: 1,
                HP: 30,
                MP: 0,
                MaxHP: 30,
                MaxMP: 0,
                Attack: 10,//10
                Guard: 1,
                Speed: 9,
                gold: 2
            });
        }
    }

    public setBubbleTalkKey(bubbleTalkKey: string) {
        this.bubbleTalkKey = bubbleTalkKey;
    }

    public talkSetting() {

        //tiledでtalkデータを設定する事
        if (this.bubbleTalkKey) {
            const bubbleTalk = new BubbleTalk(this.gameScene, this, this.bubbleTalkKey);
            bubbleTalk.init();

            this.on('pointerdown', () => {

                this.state = CharacterState.talking;

                //キャラの向きをチェック
                const fieldObjChk = new FieldObjectCheck(this.gameScene.getPlayer(), this);
                const playerDirection = fieldObjChk.getObjectDirection().object1Direction;

                //キャラの向きを設定
                if (playerDirection === 'left') {
                    this.gameScene.getPlayer().setStandFrame(this.gameScene.getPlayer().getAnimationKey().standLeft);
                    this.turnAround();
                } else if (playerDirection === 'right') {
                    this.gameScene.getPlayer().setStandFrame(this.gameScene.getPlayer().getAnimationKey().standRight);
                    this.turnAround();
                } else if (playerDirection === 'up') {
                    this.gameScene.getPlayer().setStandFrame(this.gameScene.getPlayer().getAnimationKey().standUp);
                    this.turnAround();
                } else if (playerDirection === 'down') {
                    this.gameScene.getPlayer().setStandFrame(this.gameScene.getPlayer().getAnimationKey().standDown);
                    this.turnAround();
                }

                (async () => {
                    //クリックで吹き出し会話
                    await bubbleTalk!.execTalk();

                    //会話終了後、設定を戻す
                    this.state = CharacterState.normal;

                })();
            })
        }
    }

    //enemy衝突
    _collideSetting() {
        //キャラクターやマップ作成後に実行する事

        if (this.npcType === 'enemy') {

            //オブジェクトに衝突した場合、戦闘を発生させる
            this.gameScene.physics.add.world.addCollider(this, this.gameScene.getPlayer(), () => {
                //Presenterに通知
                this.gameScene.events.emit('BATTLE', { usePatern: 'normal', fieldHitEnemy: this, canNotRunaway: false });
            }, undefined, this.gameScene);

        } else {
            this.gameScene.physics.add.collider(this, this.gameScene.getPlayer());
        }
    }

    /**
    * 移動先の座標を作成する
    * 
    * ※イベントなどで座標変更した場合は座標をnullに設定しないと動かなくなる。initMoveToPosition()を使用する事。
    * ※NPCは斜め移動無し。
    */
    private updateRandomMoveToPosition() {

        //イベント中の場合は処理しない
        if (this.state === CharacterState.event) return;

        //プレイヤーとの距離が40未満の場合は処理しない
        if (Phaser.Math.Difference(this.x, this.gameScene.getPlayer().x) < 40 && Phaser.Math.Difference(this.y, this.gameScene.getPlayer().y) < 40) return;

        //値が設定されている場合は移動中のため処理しない
        if (this.moveToPositionX && this.moveToPositionY) return;

        const makeTileMap: Phaser.Tilemaps.Tilemap = this.gameScene.getTilemap().getMakeTilemap();
        const collisionLayer: Phaser.Tilemaps.TilemapLayer = this.gameScene.getTilemap().getCollisionLayer();
        const move = new Phaser.Math.RandomDataGenerator().between(-20, 20);//指定範囲の間でランダムな整数を返す
        this.delay = new Phaser.Math.RandomDataGenerator().between(100, 200);//停止時間をランダムで設定

        //値が0の場合は処理しない
        if (move === 0) return;

        let checkX = null;
        let checkY = null;

        if (move < 0 && move % 2 === 0) {//値が負かつ偶数の場合、左方向
            checkX = this.x + (move);//移動先座標を設定
            checkY = this.y;
            //移動先の左上左下の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY(checkX - (this.body!.halfWidth + 1), (checkY + this.body!.halfHeight), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY(checkX - (this.body!.halfWidth + 1), (checkY - this.body!.halfHeight), undefined, collisionLayer)) {
                //console.log("左　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        } else if (move > 0 && move % 2 === 0) {//値が正かつ偶数の場合、右方向
            checkX = this.x + (move);
            checkY = this.y;
            //移動先の右上右下の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY(checkX + (this.body!.halfWidth + 1), (checkY + this.body!.halfHeight), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY(checkX + (this.body!.halfWidth + 1), (checkY - this.body!.halfHeight), undefined, collisionLayer)) {
                //console.log("右　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        } else if (move < 0 && move % 2 !== 0) {//値が負かつ奇数の場合、上方向
            checkX = this.x;
            checkY = this.y + (move);//移動先座標を設定
            //移動先の左上右上の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY((checkX - this.body!.halfWidth), checkY - (this.body!.halfHeight + 1), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY((checkX + this.body!.halfWidth), checkY - (this.body!.halfHeight + 1), undefined, collisionLayer)) {
                //console.log("上　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        } else if (move > 0 && move % 2 !== 0) {//値が正かつ奇数の場合、下方向
            checkX = this.x;
            checkY = this.y + (move);//移動先座標を設定
            //移動先の左下右下の座標にcollisionタイルが存在する場合は移動中止
            if (makeTileMap.hasTileAtWorldXY((checkX - this.body!.halfWidth), checkY + (this.body!.halfHeight + 1), undefined, collisionLayer)
                || makeTileMap.hasTileAtWorldXY((checkX + this.body!.halfWidth), checkY + (this.body!.halfHeight + 1), undefined, collisionLayer)) {
                //console.log("下　衝突", checkX, checkY)
                checkX = null;
                checkY = null;
                return;
            }
        }
        //console.log("NPC" + checkX, checkY)
        this.setMoveToPosition(checkX!, checkY!, 300, 2000);
    }

    //オーバーライド
    override updateStopWalk() {

        if (this.moveToPositionX === null || this.moveToPositionY === null) return;


        //this.delay = this.random.between(0, 2);//デバッグ用

        //移動先座標との差が1未満の場合は停止
        if (Phaser.Math.Difference(this.moveToPositionX, this.x) < 1 && Phaser.Math.Difference(this.moveToPositionY, this.y) < 1) {
            this.body!.setVelocity(0, 0);
            this.moveDirection = this.walkStop;
            this.delay--;
            if (this.delay <= 0) {
                this.moveToPositionX = null;//移動先の値をnullに設定
                this.moveToPositionY = null;
            }
        }
        //プレイヤーとの距離が40未満の場合は停止
        if (Phaser.Math.Difference(this.x, this.gameScene.getPlayer().x) < 40 && Phaser.Math.Difference(this.y, this.gameScene.getPlayer().y) < 40) {
            this.body.setVelocity(0, 0);
            this.moveDirection = this.walkStop;
            this.delay--;
            if (this.delay <= 0) {
                this.moveToPositionX = null;//移動先の値をnullに設定
                this.moveToPositionY = null;
            }
        }
    }

    _setInput() {
        //プレイヤーとの距離が100未満 かつ 吹き出し会話中では無い かつ 吹き出し会話が設定されている場合はマウスクリックを設定
        if (Phaser.Math.Difference(this.x, this.gameScene.getPlayer().x) < 100 && Phaser.Math.Difference(this.y, this.gameScene.getPlayer().y) < 100
            && this.state === CharacterState.normal && this.bubbleTalkKey) {
            //this.setInteractive();
            this.setInteractive({ useHandCursor: true });
        } else {
            this.disableInteractive();
        }
    }

    //キャラクターを逆向きに変更する
    public turnAround() {
        if (this.gameScene.getPlayer().getAnimationKey().standframe === this.gameScene.getPlayer().getAnimationKey().standLeft) {
            this.standframe = this.standRight;
        } else if (this.gameScene.getPlayer().getAnimationKey().standframe === this.gameScene.getPlayer().getAnimationKey().standRight) {
            this.standframe = this.standLeft;
        } else if (this.gameScene.getPlayer().getAnimationKey().standframe === this.gameScene.getPlayer().getAnimationKey().standUp) {
            this.standframe = this.standDown;
        } else if (this.gameScene.getPlayer().getAnimationKey().standframe === this.gameScene.getPlayer().getAnimationKey().standDown) {
            this.standframe = this.standUp;
        }
    }

    private delete() {
        if (this.data) {
            if (this.npcType === 'enemy') {
                if (this.data.values.HP <= 0) {
                    this.data.values.HP = 0;
                    this.gameScene.time.delayedCall(this.deleteDelay, () => {
                        this.graphicsObjList.forEach(obj => {
                            obj.destroy();
                        })
                        this.destroy();
                    }, undefined, this.gameScene);
                }
            }
        }
    }

    //このスプライトを削除
    public deleteCharacter() {
        this.gameScene.time.delayedCall(this.deleteDelay, () => {

            //スプライト部品を削除（影や吹き出し等）
            this.spriteObjList.forEach(obj => {
                obj.destroy();
            })

            //このスプライトが持つオブジェクトを全て削除
            this.graphicsObjList.forEach(obj => {
                obj.destroy();
            })
            //このスプライトを削除
            this.destroy();
        }, undefined, this.gameScene);
    }

}
