import { BaseSprite } from "@/app/(game)/core/BaseSprite";
import { GameScene } from "@/app/(game)/lib/SceneTypes";
import { State } from "@/app/(game)/lib/StateTypes";
import { CharacterState, MapLayerDepth } from "@/app/(game)/lib/FieldTypes";
import { GameStateManager, gameStateManager } from '../../../GameAllState/GameStateManager';
import { InputManager } from "@/app/(game)/core/input/InputManager";

export class Player extends BaseSprite {
    private debugFlg: boolean | undefined;

    private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
    private inputManager: InputManager;

    public body: Phaser.Physics.Arcade.Body;
    private frameRate: number = 10;
    private playerDefaultVelocity: number = 300;
    private tileSize: number = 32;
    private depthValue: number | null = null;
    private cropRectMask: Phaser.GameObjects.Graphics;
    private GeometryMask: Phaser.Display.Masks.GeometryMask;

    //クリック移動とキーボード移動の検知と二人目以降の追従処理に使用する
    private inputKeyboardOrPadFlg = false;
    private inputClickFlg = false;

    private positionHistory: { x: number, y: number }[] = [];
    private leader: Player | null = null;
    public lastHistoryUpdateTime: number = 0;

    constructor(scene: GameScene, x: number, y: number, spriteSheetKey: string, initStandKey: string) {
        super(scene, x, y, 'tex_' + spriteSheetKey, initStandKey);
        this.gameScene = scene;
        this.name = spriteSheetKey;

        this.debugFlg = scene.game.config.physics.arcade?.debug;

        //物理属性を有効、このゲームオブジェクトにArcade Physics bodyが設定される。
        this.gameScene.physics.add.existing(this);
        //(this.body as Phaser.Physics.Arcade.Body)!.setImmovable(true);//衝突処理されなくなる。

        //ボディの当たり判定、座標関係を変更
        this.setBodySize(32, 32, false);//当たり判定を32*32に設定
        this.setOffset(0, 8);//当たり判定の左上の位置を変更
        this.setDisplayOrigin(16, 24);//当たり判定の中心位置を変更

        this._animationSetting('tex_' + spriteSheetKey);

        this.body.setMaxVelocity(800); // 想定速度の2倍以上は出さない

        // ゲームの状態を監視
        const stateSubscription = gameStateManager.state$.subscribe(({ state }) => {
            if (state === State.EVENT || state === State.BUBBLE_TALK) {
                // イベント開始時に物理移動とアニメーションを強制停止
                this.stopAnimation();
            }
        });

        // 破棄時のクリーンアップ
        this.once('destroy', () => {
            stateSubscription.unsubscribe();
        });
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);

        // 位置履歴を記録（4px以上動いたら記録）
        const lastPos = this.positionHistory[this.positionHistory.length - 1];
        if (!lastPos || Phaser.Math.Distance.Between(this.x, this.y, lastPos.x, lastPos.y) > 4) {

            //移動履歴を保存し、古いのから削除
            this.positionHistory.push({ x: this.x, y: this.y });
            if (this.positionHistory.length > 100) this.positionHistory.shift();

            // 履歴を更新した時間を記録
            this.lastHistoryUpdateTime = time;
        }

        //移動制御
        if (this.leader) {
            this.updateKeyWalkMember(time);
        } else {
            this.updateKeyWalkLeader();
        }
        this._updateStopWalk();

        //depthの設定
        this.depthValue = this.y + (32 / 2) * this.scale
        if (this.name === 'meina') {
            this.setDepth(MapLayerDepth.High + this.depthValue);
        } else {
            this.setDepth(MapLayerDepth.High + this.depthValue - 1);
        }

        //キャラクターの下側を非表示にするマスク
        this.updateCharacterShapesMask();

        //クリック操作による移動でプレイヤーから一定距離以上離れたら強制的にプレイヤーの位置に更新する
        if (this.name !== 'meina' && !this.leader && Phaser.Math.Distance.BetweenPoints(this, this.gameScene.getPlayer()) > 500 && this.state === CharacterState.normal) {
            this.setMapPosition(this.gameScene.getPlayer().x, this.gameScene.getPlayer().y);
        }
    }

    public setLeader(leader: Player) { this.leader = leader; }
    public setInputKeyboardOrPadFlg(inputKeyboardOrPadFlg: boolean) { this.inputKeyboardOrPadFlg = inputKeyboardOrPadFlg; }
    public setInputClickFlg(inputClickFlg: boolean) { this.inputClickFlg = inputClickFlg; }
    public getPositionHistory() { return this.positionHistory; }
    public clearPositionHistory() { this.positionHistory = []; }

    //キー入力による移動
    private updateKeyWalkLeader() {

        if (!this.body) return;
        if (!this.cursors) return;
        if (this.state !== CharacterState.normal) return;

        //状態管理クラス
        const manager = GameStateManager.getInstance();
        if (manager.currentState === State.BUBBLE_TALK ||
            manager.currentState === State.EVENT ||
            manager.currentState === State.MENU ||
            manager.currentState === State.BATTLE
        ) { return; }

        //十字キーを取得
        const cursorsKeys = this.cursors;
        const vPadDir = this.inputManager?.virtualPadDirection;

        //値が設定されている場合はクリックによる移動中のため処理しない
        if (this.moveToPositionX && this.moveToPositionY) return;
        this.setVelocity(0);

        if (cursorsKeys.left.isDown || this.inputManager.phaserGameKeys['A']?.isDown || vPadDir === 'left' || vPadDir === 'up-left' || vPadDir === 'down-left') {
            this.moveDirection = this.walkLeft;
            this.standframe = this.standLeft;
            this.setVelocityX(-1 * this.playerDefaultVelocity);
        } else if (cursorsKeys.right.isDown || this.inputManager.phaserGameKeys['D']?.isDown || vPadDir === 'right' || vPadDir === 'up-right' || vPadDir === 'down-right') {
            this.moveDirection = this.walkRight;
            this.standframe = this.standRight;
            this.setVelocityX(this.playerDefaultVelocity);
        }
        if (cursorsKeys.up.isDown || this.inputManager.phaserGameKeys['W']?.isDown || vPadDir === 'up' || vPadDir === 'up-left' || vPadDir === 'up-right') {
            this.moveDirection = this.walkUp;
            this.standframe = this.standUp;
            this.setVelocityY(-1 * this.playerDefaultVelocity);
        } else if (cursorsKeys.down.isDown || this.inputManager.phaserGameKeys['S']?.isDown || vPadDir === 'down' || vPadDir === 'down-left' || vPadDir === 'down-right') {
            this.moveDirection = this.walkDown;
            this.standframe = this.standDown;
            this.setVelocityY(this.playerDefaultVelocity);
        }

        //停止
        if (!this.moveToPositionX
            && !this.moveToPositionY
            && !this.inputManager.phaserGameKeys['A']?.isDown
            && !this.inputManager.phaserGameKeys['D']?.isDown
            && !this.inputManager.phaserGameKeys['W']?.isDown
            && !this.inputManager.phaserGameKeys['S']?.isDown
            && !cursorsKeys.left.isDown
            && !cursorsKeys.right.isDown
            && !cursorsKeys.up.isDown
            && !cursorsKeys.down.isDown
            && !vPadDir
            && this.moveDirection !== this.walkStop) {
            this.setVelocity(0);
            this.stopAnimation();
            this.moveDirection = this.walkStop;
        }

    }

    //メンバー追従
    private updateKeyWalkMember(time: number) {

        if (!this.body) return;
        if (!this.cursors) return;
        if (this.state !== CharacterState.normal) return;
        if (this.leader?.state === CharacterState.stop) { this.setVelocity(0); return; }
        if (this.leader?.body.touching.left || this.leader?.body.touching.right || this.leader?.body.touching.up || this.leader?.body.touching.down) return

        //状態管理クラス
        const manager = GameStateManager.getInstance();
        if (manager.currentState === State.BUBBLE_TALK || manager.currentState === State.EVENT || manager.currentState === State.MENU || manager.currentState === State.BATTLE) { return; }

        //十字キーを取得
        const cursorsKeys = this.cursors;
        const vPadDir = this.inputManager?.virtualPadDirection;

        // 仮想パッドの右側ボタン（決定・キャンセル等のfaceボタン）の場合は移動処理をしない
        if (vPadDir?.startsWith('face')) return;

        //値が設定されている場合はクリックによる移動中のため処理しない
        if (this.moveToPositionX && this.moveToPositionY) return;
        this.setVelocity(0);

        // リーダーの履歴を取得
        const history = this.leader!.getPositionHistory();
        const followDelay = 8; // 追従ディレイ

        let targetposition: { x: number, y: number } = { x: 0, y: 0 };
        let beforeTargetposition: { x: number, y: number } = { x: 0, y: 0 };

        //履歴が足りない場合は何もしない
        if (history.length <= followDelay) return;

        //移動先履歴を取得
        targetposition = history[history.length - followDelay];
        beforeTargetposition = history[history.length - followDelay - 1];

        // leaderが前フレームで壁に衝突していた場合は追従しない
        // body.blocked は物理エンジンが実行済みの前フレームの衝突状態を保持しており
        // preUpdate（物理実行前）の時点で正しく参照できる
        // const leaderBody = this.leader!.body as Phaser.Physics.Arcade.Body;
        // if (!leaderBody.blocked.none) { this.setVelocity(0); return; }

        // リーダーの履歴が一定時間（例：100ms）更新されていなければ停止とみなす
        // 滑り移動中であっても、4px動いて履歴が更新されない限りはここに入る
        if (time - this.leader!.lastHistoryUpdateTime > 20) {
            this.setVelocity(0);
            this.stopAnimation();
            return;
        }

        /**
         * キーボードまたはパッド入力が発生した場合のみポジションをリセット
         * 状態を明確にするためクリック移動とキーボード移動をフラグ管理している
         */
        if (!this.inputKeyboardOrPadFlg &&
            this.inputClickFlg && (
                this.inputManager.phaserGameKeys['A']?.isDown ||
                this.inputManager.phaserGameKeys['D']?.isDown ||
                this.inputManager.phaserGameKeys['W']?.isDown ||
                this.inputManager.phaserGameKeys['S']?.isDown ||
                cursorsKeys.left.isDown ||
                cursorsKeys.right.isDown ||
                cursorsKeys.up.isDown ||
                cursorsKeys.down.isDown ||
                vPadDir)) {
            this.setPosition(this.leader!.x, this.leader!.y)
            this.leader!.clearPositionHistory();
            this.inputKeyboardOrPadFlg = true;
            this.inputClickFlg = false;
        }

        //リーダーとの距離が一定以上離れた場合は強制的にターゲットポジションに移動させる
        if (Phaser.Math.Distance.Between(this.leader!.x, this.leader!.y, this.x, this.y) > 48) {
            this.setPosition(targetposition.x, targetposition.y);
        }

        //クリック移動ではない場合に処理する
        if (!this.inputClickFlg) {

            if (beforeTargetposition.x - targetposition.x < 0) {
                this.moveDirection = this.walkRight;
                this.standframe = this.standRight;
                this.setVelocityX(this.playerDefaultVelocity);
            }
            else if (beforeTargetposition.x - targetposition.x > 0) {
                this.moveDirection = this.walkLeft;
                this.standframe = this.standLeft;
                this.setVelocityX(-1 * this.playerDefaultVelocity);
            }
            if (beforeTargetposition.y - targetposition.y < 0) {
                this.moveDirection = this.walkDown;
                this.standframe = this.standDown;
                this.setVelocityY(this.playerDefaultVelocity);
            }
            else if (beforeTargetposition.y - targetposition.y > 0) {
                this.moveDirection = this.walkUp;
                this.standframe = this.standUp;
                this.setVelocityY(-1 * this.playerDefaultVelocity);
            }
        }

        //停止
        if (!this.moveToPositionX && !this.moveToPositionY &&
            !this.inputManager.phaserGameKeys['A']?.isDown &&
            !this.inputManager.phaserGameKeys['D']?.isDown &&
            !this.inputManager.phaserGameKeys['W']?.isDown &&
            !this.inputManager.phaserGameKeys['S']?.isDown &&
            !cursorsKeys.left.isDown &&
            !cursorsKeys.right.isDown &&
            !cursorsKeys.up.isDown &&
            !cursorsKeys.down.isDown &&
            !vPadDir &&
            this.moveDirection !== this.walkStop) {
            this.setVelocity(0);
            this.stopAnimation();
            this.moveDirection = this.walkStop;
            this.inputKeyboardOrPadFlg = false;
            //※クリックフラグ更新はPlayerPresenterで処理
        }
    }

    //移動不能チェック
    //※停止についてはsprite自身で判定
    _updateStopWalk() {
        if (!this.body) return;
        if (this.state !== CharacterState.normal) return;
        if (this.leader?.state === CharacterState.stop) { this.setVelocity(0); return; }

        //値が設定されていない場合は処理しない
        if (!this.moveToPositionX && !this.moveToPositionY) return;

        //移動先座標との差が1未満の場合は停止
        if (Phaser.Math.Difference(this.moveToPositionX!, this.x) < 1 && Phaser.Math.Difference(this.moveToPositionY!, this.y) < 1) {
            this.body.setVelocity(0, 0);
            this.moveDirection = this.walkStop;
            this.moveToPositionX = null;//移動先の値をnullに設定
            this.moveToPositionY = null;
        }

        //壁に当たってこれ以上移動できない状態の場合は移動を停止する
        //x方向またはy方向の速度が0の場合、移動不能状態と判定する
        if (this.body.velocity.x === 0 || this.body.velocity.y === 0) {

            //移動不能状態の時間をカウント
            this.moveStopCount++;

            //壁を滑って移動可能になった場合を考慮し、再度移動先を設定する。1000ミリ秒内に目標に到達するように調整される。
            this.scene.physics.moveTo(this, this.moveToPositionX!, this.moveToPositionY!, this.moveVelocity, this.moveDefaultTime / 2);

            //移動不能状態が一定時間続いた場合は停止
            if (this.moveStopCount > 50) {
                this.moveStopCount = 0;
                this.initMoveToPosition();
            }
        }

        //他スプライトのbodyと衝突した場合は停止
        if (!this.body.touching.none) {
            this.initMoveToPosition();
        }
    }

    //共通化出来る
    _animationSetting(spriteSheetKey: string) {
        this.anims.create({
            key: this.walkLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 3, end: 5 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 6, end: 8 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 9, end: 11 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.walkDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 0, end: 2 }),
            frameRate: this.frameRate,
            yoyo: true
        });
        this.anims.create({
            key: this.standLeft,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 4, end: 4 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standRight,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 7, end: 7 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standUp,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 10, end: 10 }),
            frameRate: this.frameRate,
        });
        this.anims.create({
            key: this.standDown,
            frames: this.anims.generateFrameNumbers(spriteSheetKey, { start: 1, end: 1 }),
            frameRate: this.frameRate,
        });
    }

    //キャラの一部を非表示にするマスク
    private updateCharacterShapesMask() {

        const makeTilemap: Phaser.Tilemaps.Tilemap = this.gameScene.getTilemap().getMakeTilemap();

        //以下のチェックはGraphicsの処理を減らすため、対象タイルマップの存在有無チェックを行っていたが、一つのGraphicsに複数描画する分には殆ど処理は重くならないため不要とする
        // if (!makeTilemap.getTileAtWorldXY(this.x + this.tileSize / 2 * this.scale, this.y - this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x + this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x - this.tileSize / 2 * this.scale, this.y - this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x - this.tileSize / 2 * this.scale, this.y + this.tileSize / 2 * this.scale, false, undefined, mapName) &&
        //     !makeTilemap.getTileAtWorldXY(this.x, this.y - maskHeight, false, undefined, mapName)) {
        //     this.clearMask();
        //     return;
        // }

        //更新前にマスクを削除
        if (this.GeometryMask) { this.clearMask(); }

        //初回作成時
        if (!this.cropRectMask) { this.cropRectMask = this.scene.add.graphics(); };

        //デバッグ用、trueの場合は非表示
        if (!this.debugFlg) {
            this.cropRectMask.setVisible(false);
        }
        this.cropRectMask.setDepth(5000);
        this.cropRectMask.clear();//再描画のためクリア

        const whiteColor = Phaser.Display.Color.HexStringToColor('#ffffff').color;
        this.cropRectMask.fillStyle(whiteColor);

        //キャラクターの足元を基準とする、値はタイルサイズ32を基準
        const maskY = this.y + 32 / 2;

        //四角形オブジェクト作成
        for (const obj of makeTilemap.objects) {
            if (obj.name === "MASK_RECT") {
                for (const rect of obj.objects) {
                    for (const property of rect.properties) {
                        if (property.name === "height") {
                            this.cropRectMask.fillRect(
                                rect.x!,
                                maskY - property.value! > rect.y! ? maskY - property.value! : rect.y!,
                                rect.width!,
                                (rect.y! + rect.height! - maskY + property.value!) < 0 ? 0 : (rect.y! + rect.height! - maskY + property.value!)
                            )
                        }
                    }
                }
            }
        }

        //多角形オブジェクト作成
        for (const obj of makeTilemap.objects) {
            if (obj.name === "MASK_POLYGON") {
                for (const polygon of obj.objects) {
                    for (const property of polygon.properties) {
                        if (property.name === "height") {
                            if (polygon.polygon) {
                                // 1. 座標を修正してポイント配列を作成（前回のアドバイス通り）
                                const points = polygon.polygon.map(p => ({
                                    x: (polygon.x || 0) + p.x,
                                    y: (polygon.y || 0) + p.y
                                }));

                                // 2. ポリゴンを「this.y 以下」にクリッピングして描画する
                                // ※ GeometryMaskはステンシルバッファで動作するためERASEブレンドモードが効かない
                                //    そのため、描画する領域自体を数学的に絞り込む（Sutherland-Hodgman法）
                                const clippedPoints = clipPolygonToBottom(points, maskY - property.value!);
                                if (clippedPoints.length >= 3) {
                                    this.cropRectMask.fillStyle(0xffffff, 1);
                                    this.cropRectMask.setBlendMode(Phaser.BlendModes.NORMAL);
                                    this.cropRectMask.fillPoints(clippedPoints, true);
                                }
                            }
                        }
                    }
                }
            }

            // //図形を作成
            this.cropRectMask.fillPath();

            //マスク作成のためcreateGeometryMaskを作成し、マスク処理を反転
            this.GeometryMask = this.cropRectMask.createGeometryMask();
            this.GeometryMask.setInvertAlpha();
            this.setMask(this.GeometryMask);
        }
    }

    public setCursors(cursors: Phaser.Types.Input.Keyboard.CursorKeys) {
        this.cursors = cursors;
    }

    public setInputManager(inputManager: InputManager) {
        this.inputManager = inputManager;
    }
}



/**
 * Sutherland-Hodgman法でポリゴンを「y >= clipY」の半平面にクリッピングする
 * キャラクターのY座標以下の部分だけを残すために使用
 */
function clipPolygonToBottom(points: { x: number; y: number }[], clipY: number): { x: number; y: number }[] {
    const result: { x: number; y: number }[] = [];
    const n = points.length;

    for (let i = 0; i < n; i++) {
        const current = points[i];
        const next = points[(i + 1) % n];

        const currentInside = current.y >= clipY;
        const nextInside = next.y >= clipY;

        if (currentInside) {
            result.push(current);
        }

        // エッジがクリップ境界（y = clipY）を跨ぐ場合は交点を追加
        if (currentInside !== nextInside) {
            const t = (clipY - current.y) / (next.y - current.y);
            result.push({
                x: current.x + t * (next.x - current.x),
                y: clipY
            });
        }
    }

    return result;
}


