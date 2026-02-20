import { BattleScene } from "../../lib/types";
import { EnergyGauge } from "../../util/EnergyGauge";

export class EnemySelectWindow extends Phaser.GameObjects.Container {
    private enemyPartyMap: Map<string, Phaser.GameObjects.Image>;

    private nowSelectNo: number = 0;

    private lightUpDownTween: Phaser.Tweens.Tween;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = EnemySelectWindow.name;
        this.scene.add.existing(this);
        this.addToDisplayList();
        this.addToUpdateList();

    }

    public init(enemyPartyMap: Map<string, Phaser.GameObjects.Image>) {
        this.enemyPartyMap = enemyPartyMap;
        this.x = 0;
        this.y = 0;
        this.createEnemy();
    }

    preUpdate() {
        this.updateView();
    }

    //敵の画像を作成
    private createEnemy() {
        let maxWidth = 0;

        const standardPosition = Number(this.scene.game.config.height) * 0.7;

        //キャラ画像の配置、キャラ等身（高さ）はイラストを調整すること
        this.enemyPartyMap.forEach(enemy => {
            enemy.setOrigin(0);
            enemy.x = maxWidth;
            enemy.y = standardPosition - enemy.height;

            //ゲージ作成配置
            const backGaugeHP = new EnergyGauge(this.scene, enemy, 'MaxHP');
            const gaugeHP = new EnergyGauge(this.scene, enemy, 'HP');
            const posX = maxWidth + (enemy.width * enemy.scaleX / 2 - backGaugeHP.getWidth() / 2);

            backGaugeHP.setPosition(posX, enemy.y - 30);
            gaugeHP.setPosition(posX, enemy.y - 30);

            //コンテナに追加
            this.add([enemy, backGaugeHP, gaugeHP]);

            //参照を画像データに格納しておく
            enemy.setData('backGaugeHP', backGaugeHP);
            enemy.setData('gaugeHP', gaugeHP);

            //リストにオブジェクトの参照を保存
            // list.set('displayObjectSet', [enemy, backGaugeHP, gaugeHP]);

            //次の敵配置用に数値を保存
            maxWidth = maxWidth + enemy.width * enemy.scaleX;
            //maxHeight = enemy.height * enemy._scaleY;
        });

        //コンテナ全体の配置を調整
        const displayPosX = Number(this.scene.game.config.width) / 2 - maxWidth / 2;
        this.x = displayPosX;
    }

    //表示状態
    updateView() {
        //処理が必要なら実装する
    }

    show() {
        // this.setVisible(true);
        this.enableSelect();
    }
    move() { }
    hide() { this.disableInteractive(); }

    private enableSelect() {

        //一番左の敵を点滅させる（ユーザー選択の補助）
        this.lightUpDown(this.enemyPartyMap.values().next().value!);

        this.enemyPartyMap.forEach(enemy => {

            //選択可能に設定
            enemy.setInteractive({ useHandCursor: true });

            //マウスオーバー中の敵を点滅
            enemy.on('pointerover', () => {
                this.lightUpDown(enemy);
            }, this);

            enemy.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                //左クリック
                if (pointer.leftButtonDown()) {
                    pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
                    this.scene.input.setDefaultCursor('default');//カーソルを戻す
                    this.emit('Enemy_Select_Submit', enemy);

                    this.deleteLight();
                    this.disableSelect();
                }

                //右クリック
                if (pointer.rightButtonDown()) {
                    pointer.reset();
                    this.scene.input.setDefaultCursor('default');//カーソルを戻す
                    this.emit('Select_back_Submit');

                    this.deleteLight();
                    this.disableSelect();
                }
            }, this);
        })
    }

    disableSelect() {
        this.enemyPartyMap.forEach(enemy => {
            enemy.disableInteractive();
        });
    }

    //選択中キャラクターを点滅
    lightUpDown(enemy: Phaser.GameObjects.Image) {

        //初めに全ての点滅を削除
        this.deleteLight();

        this.lightUpDownTween = this.scene.tweens.addCounter({//このtweenはオブジェクトをターゲットとせず、設定した値を更新し続ける
            from: 255,
            to: 128,
            duration: 400,
            ease: 'linear',
            yoyo: true,
            repeat: -1,
            onUpdate: (tween) => {
                //このtweenから値を取得する
                const value = Math.floor(tween.getValue()!);

                //取得した値をセットする
                enemy.setTint(Phaser.Display.Color.GetColor(value, value, value));
            },
        });

    }

    deleteLight() {
        if (this.lightUpDownTween) {
            this.lightUpDownTween.destroy();
        }

        this.enemyPartyMap.forEach(enemy => {
            enemy.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        });
    }
}
