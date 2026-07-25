import { CharacterState } from '../lib/FieldTypes';
import { FieldScene } from '../lib/SceneTypes';
import {
    parseSpritesheetKeyOrder,
    createDirectionalWalkAnimation,
    createDirectionalStandAnimation,
    Direction,
    DirectionalWalkOptions,
    DirectionalStandOptions
} from './AnimationHelper';

/**
 * キャラクタースプライトの共通クラス
 * 
 * setMoveToPosition()を呼び出すことで移動する。
 * 移動処理は子クラスで実装する事。
 *
 * @export
 * @class Common
 * @extends {Phaser.Physics.Arcade.Sprite}
 */
export class BaseCharacterSprite extends Phaser.Physics.Arcade.Sprite {
    protected fieldScene: FieldScene;
    protected spriteSheetKey: string;
    protected walkLeft: string = 'walk_left';
    protected walkRight: string = 'walk_right';
    protected walkUp: string = 'walk_up';
    protected walkDown: string = 'walk_down';
    protected walkStop: string = 'walk_stop';
    protected standframe: string = '';
    protected standLeft: string = 'stand_left';
    protected standRight: string = 'stand_right';
    protected standUp: string = 'stand_up';
    protected standDown: string = 'stand_down';
    protected moveToPositionX: number | null = null;
    protected moveToPositionY: number | null = null;
    protected moveDirection: string = '';//方向
    protected moveVelocity: number = 50;//速度
    protected moveDefaultTime: number = 1000;//速度
    protected moveStopCount: number = 0;

    constructor(fieldScene: FieldScene, x: number, y: number, spriteSheetKey: string) {
        super(fieldScene, x, y, spriteSheetKey);
        this.fieldScene = fieldScene;
        this.animationKeySetting(spriteSheetKey);
        this.addToUpdateList();
        this.addToDisplayList();
    }

    preUpdate(time: number, delta: number) {
        super.preUpdate(time, delta);
        this.setDepth(this.y + (32 / 2) * this.scale);
        this.updateStopWalk();
        this.stopCheck();
    }


    //アニメーションのキーを作成
    private animationKeySetting(spriteSheetKey: string) {
        //各アニメーションキーを設定
        this.spriteSheetKey = spriteSheetKey;
        this.walkLeft = spriteSheetKey + '-' + this.walkLeft;
        this.walkRight = spriteSheetKey + '-' + this.walkRight;
        this.walkUp = spriteSheetKey + '-' + this.walkUp;
        this.walkDown = spriteSheetKey + '-' + this.walkDown;
        this.walkStop = spriteSheetKey + '-' + this.walkStop;
        this.standLeft = spriteSheetKey + '-' + this.standLeft;
        this.standRight = spriteSheetKey + '-' + this.standRight;
        this.standUp = spriteSheetKey + '-' + this.standUp;
        this.standDown = spriteSheetKey + '-' + this.standDown;

        //初期状態を設定
        this.moveDirection = spriteSheetKey + '-' + 'walk_stop';
    }

    public setupDirectionalAnimations(
        spriteSheetKey: string,
        spritesheetKeyOrder: string = 'down,left,right,up',
        framesPerDirection: number,
        frameRate: number,
        walkOptions?: DirectionalWalkOptions,
        standOptions?: DirectionalStandOptions,
        standFrameOffset: number = 1
    ) {
        const order = this.parseSpritesheetKeyOrder(spritesheetKeyOrder);
        const directions: Direction[] = ['left', 'right', 'up', 'down'];

        directions.forEach(direction => {
            this.createDirectionalWalkAnimation(spriteSheetKey, direction, order, framesPerDirection, frameRate, walkOptions);
            this.createDirectionalStandAnimation(spriteSheetKey, direction, order, framesPerDirection, standFrameOffset, frameRate, standOptions);
        });
    }

    // spritesheetKeyOrder を正規化して Direction 配列に変換する。
    protected parseSpritesheetKeyOrder(order: string): readonly Direction[] {
        return parseSpritesheetKeyOrder(order);
    }

    // 方向ごとの歩行アニメを生成する。
    protected createDirectionalWalkAnimation(
        spriteSheetKey: string,
        direction: 'left' | 'right' | 'up' | 'down',
        order: readonly Direction[],
        framesPerDirection: number,
        frameRate: number,
        options?: DirectionalWalkOptions
    ) {
        createDirectionalWalkAnimation(
            this.anims,
            spriteSheetKey,
            this.getWalkKey(direction),
            direction,
            order,
            framesPerDirection,
            frameRate,
            options
        );
    }

    // 方向ごとの待機アニメを生成する。
    protected createDirectionalStandAnimation(
        spriteSheetKey: string,
        direction: 'left' | 'right' | 'up' | 'down',
        order: readonly Direction[],
        framesPerDirection: number,
        standFrameOffset: number,
        frameRate: number,
        options?: DirectionalStandOptions
    ) {
        createDirectionalStandAnimation(
            this.anims,
            spriteSheetKey,
            this.getStandKey(direction),
            direction,
            order,
            framesPerDirection,
            standFrameOffset,
            frameRate,
            options
        );
    }

    // 方向に対応する歩行キーを返す。
    public getWalkKey(direction: 'left' | 'right' | 'up' | 'down') {
        switch (direction) {
            case 'left': return this.walkLeft;
            case 'right': return this.walkRight;
            case 'up': return this.walkUp;
            case 'down': return this.walkDown;
        }
    }

    // 方向に対応する待機キーを返す。
    public getStandKey(direction: 'left' | 'right' | 'up' | 'down') {
        switch (direction) {
            case 'left': return this.standLeft;
            case 'right': return this.standRight;
            case 'up': return this.standUp;
            case 'down': return this.standDown;
        }
    }

    protected updateStopWalk() { }

    //外部操作による指定座標位置まで移動した後の停止処理
    private stopCheck() {
        if (this.state === CharacterState.event) {
            const stopTime: number = 5;//移動先座標との差が5未満の場合は停止

            //X,Y座標の指定をチェックし、合致する方向に移動
            if (this.moveToPositionX !== null && this.moveToPositionY === null) {
                if (Phaser.Math.Difference(this.moveToPositionX, this.x) < stopTime) {
                    this.moveDirection = this.walkStop;
                    this.x = this.moveToPositionX;//目標座標との差があるため、最後に位置を設定
                    this.initMoveToPosition();
                }
            } else if (this.moveToPositionY !== null && this.moveToPositionX === null) {
                if (Phaser.Math.Difference(this.moveToPositionY, this.y) < stopTime) {
                    this.moveDirection = this.walkStop;
                    this.y = this.moveToPositionY;//目標座標との差があるため、最後に位置を設定
                    this.initMoveToPosition();
                }
            }
        }
    }

    //移動先座標を設定
    public setMoveToPosition(x: number, y: number, partyNum: number, npcFlg: boolean, velocity?: number, moveDefaultTime?: number) {

        //移動可能状態の場合に処理。　※walking中の処理はプレイヤーのマウス操作に対応
        if (this.state === CharacterState.normal || this.state === CharacterState.walking) {

            const v: number = velocity ? velocity : this.moveVelocity;//速度
            const mt: number = moveDefaultTime ? moveDefaultTime : this.moveDefaultTime;//1000ミリ秒内に目標に到達するように調整される
            //※プレイヤーの場合、すり抜け防止のためthis.body.setMaxVelocity();を設定すること

            //移動先座標を設定
            this.moveToPositionX = x;
            this.moveToPositionY = y;

            //プレイヤー追従キャラの場合
            if (!npcFlg && partyNum > 0) {

                // リーダーとの距離を計算（ピタゴラスの定理）
                const distance = Phaser.Math.Distance.Between(this.x, this.y, x, y);

                // 停止距離のしきい値（例：32px〜40px程度。キャラのサイズに合わせて調整）
                const stopDistance = 32 * partyNum;

                if (distance < stopDistance) {
                    // 十分に近い場合は移動せず、その場で停止
                    if (this.body) {
                        (this.body as Phaser.Physics.Arcade.Body).setVelocity(0);
                    }
                    return;
                }

                // 停止距離より遠い場合は、移動先を少しずらす
                const angle = Phaser.Math.Angle.Between(x, y, this.x, this.y);
                const offsetX = Math.cos(angle) * stopDistance;
                const offsetY = Math.sin(angle) * stopDistance;

                this.moveToPositionX = x + offsetX;
                this.moveToPositionY = y + offsetY;
            }

            //方向を設定
            this.setMoveDirection(this.moveToPositionX, this.moveToPositionY);

            //移動
            this.scene.physics.moveTo(this, this.moveToPositionX, this.moveToPositionY, v, mt);

            //移動中に設定
            this.state = CharacterState.walking;

            //移動アニメーション再生
            this.anims.play(this.moveDirection, true);
        }
    }

    //移動方向設定
    private setMoveDirection(moveToPositionX: number, moveToPositionY: number) {

        const rad = Phaser.Math.Angle.Between(this.x, this.y, moveToPositionX, moveToPositionY);

        //左
        if (rad < -135 * (Math.PI / 180) || rad > 135 * (Math.PI / 180)) {
            this.moveDirection = this.walkLeft;
            this.standframe = this.standLeft;
        }
        //右
        if (rad > -45 * (Math.PI / 180) && rad < 45 * (Math.PI / 180)) {
            this.moveDirection = this.walkRight;
            this.standframe = this.standRight;
        }
        //上
        if (rad < -45 * (Math.PI / 180) && rad > -135 * (Math.PI / 180)) {
            this.moveDirection = this.walkUp;
            this.standframe = this.standUp;
        }
        //下
        if (rad > 45 * (Math.PI / 180) && rad < 135 * (Math.PI / 180)) {
            this.moveDirection = this.walkDown;
            this.standframe = this.standDown;
        }

        // console.log("右上", -45 * (Math.PI / 180))
        // console.log("左上", -135 * (Math.PI / 180))
        // console.log("左下", 135 * (Math.PI / 180))
        // console.log("右下", 45 * (Math.PI / 180))
    }

    //移動先初期化。座標位置を外部から変更した場合は必ず呼び出すこと。
    public initMoveToPosition() {
        //イベント中の場合は処理しない
        if (this.state === CharacterState.event) return;

        if (!this.body) return;

        (this.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
        // this.moveToPositionX = null;//移動先の値をnullに設定
        // this.moveToPositionY = null;
        this.state = CharacterState.normal;

        // アニメーションがまだ再生されていない場合のみ再生
        if (this.anims.currentAnim?.key !== this.standframe) {
            this.anims.play(this.standframe, true);
        }
        //return this;//メソッドチェーンの記法。このメソッドの参照を返し、次のメソッドが実行可能となる。
    }

    //アニメーションを停止、イベント中などで使用
    public stopAnimation() {
        this.stop();
        this.initMoveToPosition();
        this.moveDirection = this.walkStop;
    }

    //アニメーションを設定する（移動しない）
    public setAnimDirection(WalkKey: string) {

        // getWalkKey()を使用する事
        this.moveDirection = WalkKey;

        //移動アニメーション再生
        this.anims.play(this.moveDirection, true);
    }

    public setStandFrame(standkey: string) {

        //getStandKey()を使用する事
        this.standframe = standkey;

        //停止アニメーション再生
        this.anims.play(this.standframe, true);
    }

    public getCurrentStandFrame(): string { return this.standframe; }

    // public getInitDirection() {
    //     if (this.getCurrentStandFrame() === this.standLeft) {
    //         return 'left';
    //     } else if (this.getCurrentStandFrame() === this.standRight) {
    //         return 'right';
    //     } else if (this.getCurrentStandFrame() === this.standUp) {
    //         return 'up';
    //     } else if (this.getCurrentStandFrame() === this.standDown) {
    //         return 'down';
    //     }
    // }

    public getDirection(): string {
        if (this.moveDirection === this.walkLeft || this.standframe === this.standLeft) { return 'left'; }
        else if (this.moveDirection === this.walkRight || this.standframe === this.standRight) { return 'right' }
        else if (this.moveDirection === this.walkUp || this.standframe === this.standUp) { return 'up' }
        else if (this.moveDirection === this.walkDown || this.standframe === this.standDown) { return 'down' }
        else { return '' }
    }
}