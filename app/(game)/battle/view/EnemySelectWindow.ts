import { SkillDetail } from "../../lib/types";
import { BattleScene } from "../../lib/types";
import { EnergyGauge } from "../../util/EnergyGauge";
import { MessageObject } from "../../util/MessageObject";
import { MessageWindow } from "../../util/MessageWindow";

export class EnemySelectWindow extends Phaser.GameObjects.Container {
    private nowSelectCharacter: Phaser.GameObjects.Sprite;

    private messageText: string = '獲物はあいつだ！！';
    private enemyPartyList: Phaser.GameObjects.Image[];
    private lightUpDownTween: Phaser.Tweens.Tween;
    private lightDownUpTween: Phaser.Tweens.Tween;

    private messageObject: Phaser.GameObjects.Text;
    private messageWindow: Phaser.GameObjects.Graphics;
    private backButton: Phaser.GameObjects.Text;
    private backButtonWindow: MessageWindow;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.name = EnemySelectWindow.name;
        this.scene.add.existing(this);
        this.addToDisplayList();
        this.addToUpdateList();
    }

    public init(enemyPartyList: Phaser.GameObjects.Image[]) {
        this.enemyPartyList = enemyPartyList;
        this.x = 0;
        this.y = 0;
        this.createEnemy();
        this.createMessage();

        this.messageObject.setVisible(false);
        this.messageWindow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);
    }

    preUpdate() {
        this.updateView();
    }

    //敵の画像を作成
    private createEnemy() {
        let maxWidth = 0;

        const standardPosition = Number(this.scene.game.config.height) * 0.7;

        //キャラ画像の配置、キャラ等身（高さ）はイラストを調整すること
        for (const enemy of this.enemyPartyList) {
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

            //次の敵配置用に数値を保存
            maxWidth = maxWidth + enemy.width * enemy.scaleX;
            //maxHeight = enemy.height * enemy._scaleY;
        }

        //コンテナ全体の配置を調整
        const displayPosX = Number(this.scene.game.config.width) / 2 - maxWidth / 2;
        this.x = displayPosX;
        this.y += 150;
    }

    private createMessage() {
        const tilesize = 32;

        //テキスト作成
        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        this.messageObject = messageObjectInstance.createTextObject(this.scene, 0, 0, this.messageText);
        this.messageObject.setDepth(100)

        //テキストオブジェクトの位置を更新
        this.messageObject.x = Number(this.scene.game.canvas.width) / 2 - this.messageObject.width / 2;
        this.messageObject.y = 500;

        //メッセージウィンドウを作成
        if (this.messageWindow) {
            this.messageWindow.destroy();
        }
        const messageWindowInstance = new MessageWindow(this.scene);
        messageWindowInstance.init();
        messageWindowInstance.createOneColumnOneWindow(this.messageObject);
        this.messageWindow = messageWindowInstance;
        this.messageWindow.setDepth(this.messageObject.depth - 10)

        this.backButtonCreate(this.messageObject.x + this.messageObject.width + tilesize / 2, this.messageObject.y - tilesize);
    }

    private backButtonCreate(x: number, y: number) {

        const messageObjectInstance = new MessageObject();
        messageObjectInstance.init(this.scene);
        messageObjectInstance.getTextInfomation();

        this.backButton = messageObjectInstance.createTextObject(this.scene, x, y + 16, "✖");
        this.backButton.setDepth(Number(this.scene.game.config.height) + 1);

        //ウィンドウ作成
        this.backButtonWindow = new MessageWindow(this.scene);
        this.backButtonWindow.init();
        this.backButtonWindow.createOneColumnOneWindow(this.backButton, 16);

        // 左右の余白を等しく設定
        this.backButtonWindow.x = x;
        this.backButtonWindow.y = y + 16;
        this.backButtonWindow.setDepth(Number(this.scene.game.config.height));

        this.backButton.setDepth(this.backButtonWindow.depth + 1);
        this.backButton.setInteractive({ useHandCursor: true });
        this.backButton.on('pointerdown', () => {
            this.emit('Select_back_Submit');
            console.log("戻るが押された");

            this.deleteLight();
            this.disableSelect();
        }, this);
    }

    //表示状態
    updateView() {
        //処理が必要なら実装する
    }

    show(data: Phaser.GameObjects.Sprite) {
        this.nowSelectCharacter = data;

        this.messageObject.setVisible(true);
        this.messageWindow.setVisible(true);
        this.backButton.setVisible(true);
        this.backButtonWindow.setVisible(true);
        this.enableSelect();
    }
    move() { }
    hide() {
        this.messageObject.setVisible(false);
        this.messageWindow.setVisible(false);
        this.backButton.setVisible(false);
        this.backButtonWindow.setVisible(false);
        this.deleteLight();
        this.disableInteractive();
    }

    private enableSelect() {

        for (const [index, enemy] of this.enemyPartyList.entries()) {
            // HPが0の場合は選択対象外
            if (enemy.getData('HP') <= 0) {
                continue;
            }

            if (index % 2 == 1) { this.lightUpDown(enemy); }
            if (index % 2 == 0) { this.lightDownUp(enemy); }

            //選択可能に設定
            enemy.setInteractive({ useHandCursor: true });

            //マウスオーバー中の敵を点滅
            enemy.on('pointerover', () => {
                //this.lightUpDown(enemy);
            }, this);

            enemy.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
                //左クリック
                if (pointer.leftButtonDown()) {
                    pointer.reset();//入力状態をリセット、リセットしないと押下中に連続で処理される
                    this.scene.input.setDefaultCursor('default');//カーソルを戻す
                    this.emit('Enemy_Select_Submit', enemy);

                    this.deleteLight();
                    this.disableSelect();

                    this.messageObject.setVisible(false);
                    this.messageWindow.setVisible(false);
                    this.backButton.setVisible(false);
                    this.backButtonWindow.setVisible(false);
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
        }
    }

    disableSelect() {
        for (const enemy of this.enemyPartyList) {
            enemy.disableInteractive();
        }
    }

    //選択中キャラクターを点滅（奇数用）
    lightUpDown(enemy: Phaser.GameObjects.Image) {
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

    //選択中キャラクターを点滅（偶数用）
    lightDownUp(enemy: Phaser.GameObjects.Image) {
        this.lightDownUpTween = this.scene.tweens.addCounter({//このtweenはオブジェクトをターゲットとせず、設定した値を更新し続ける
            from: 128,
            to: 255,
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
        if (this.lightUpDownTween) { this.lightUpDownTween.destroy(); }
        if (this.lightDownUpTween) { this.lightDownUpTween.destroy(); }

        for (const enemy of this.enemyPartyList) {
            enemy.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        }
    }
}
