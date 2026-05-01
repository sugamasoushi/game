import { GameScene, BattleScene } from "../../lib/types";
import { MessageObject } from "../../util/MessageObject";
import { EnergyGauge } from "../../util/EnergyGauge";
import { CharacterGameObject } from '../../event/view/CharacterGameObject';
import { DataDefinition } from '../../Data/DataDefinition';
import { SearchCharacterData } from '../../Data/SearchCharacterData';

export class PlayerPartyWindow extends Phaser.GameObjects.Container {
    private gameScene: GameScene;
    private characterGameObject: CharacterGameObject;
    private charIconList: Phaser.GameObjects.Image[] = [];
    private lightUpDownIcon: Phaser.GameObjects.Image;

    private partyList: string[]

    //※選択リストは必ずテキストオブジェクトを格納したmainColumnを参照する事。
    //コンテナにはウィンドウオブジェクトも含まれているため、container.listを使用すると不要な番号を取得してしまう。
    //キャラ選択は0番目から昇順に行う、順番を可変にする場合は考慮する事
    private mainColumn: string[] = ['Lv', 'HP', 'MP'];
    private selectList: Phaser.GameObjects.Text[] = [];
    private clickZone: Phaser.GameObjects.Zone[] = [];
    // characterObjectList = new Array();
    private nowHPColmunList: Phaser.GameObjects.Text[] = [];
    private nowMPColmunList: Phaser.GameObjects.Text[] = [];

    private characterObject: Map<string, {//キーはキャラ名前
        obj: {
            CharacterIcon: Phaser.GameObjects.Image;
            // clickZone: Phaser.GameObjects.Zone;
            nowHPText: Phaser.GameObjects.Text;
            maxHPText: Phaser.GameObjects.Text;
            nowMPText: Phaser.GameObjects.Text;
            maxMPText: Phaser.GameObjects.Text;
        }
    }>;


    //nowSelectNo = 0;//現状は昇順でキャラ選択するのみ
    private lightUpDownTween: Phaser.Tweens.Tween;

    constructor(battleScene: BattleScene) {
        super(battleScene);
        this.gameScene = (this.scene.scene.get('Game') as GameScene);
    }

    public init() {
        this.characterGameObject = new CharacterGameObject();
        this.x = 0;
        this.y = 0;
        this.name = 'MainWindow';
        this.scene.add.existing(this);
        this.addToDisplayList();
        this.addToUpdateList();
        this.name = PlayerPartyWindow.name;

        //this.setVisible(false);//非表示
    }


    preUpdate() {

        if (this.characterObject) {

            //テキストを更新、ゲージは別
            for (const namelist of this.partyList) {
                const spritedata = this.characterGameObject.getSprite(this.gameScene, namelist);
                this.characterObject.get(namelist)!.obj.nowHPText.setText(spritedata.data.get('HP'));
                this.characterObject.get(namelist)!.obj.nowMPText.setText(spritedata.data.get('MP'));
            }
        }
    }

    public createBattleCharacterIcon(playerPartyList: Phaser.GameObjects.Sprite[], x: number, y: number) {
        const searchCharacterData = new SearchCharacterData(this.gameScene.cache.json);

        this.x = x;
        this.y = y;

        const msgObjInstance = new MessageObject();
        msgObjInstance.init(this.scene);

        // 各種リストを初期化
        this.partyList = [];
        this.charIconList = [];
        this.selectList = [];
        this.nowHPColmunList = [];
        this.nowMPColmunList = [];
        this.characterObject = new Map();

        let nextCharacterX = 0;
        const nextCharacterY = 0;

        for (const character of playerPartyList) {

            //キャラクター名のリストを作成
            this.partyList.push(character.name);

            //キャラの画像キーを取得
            const iconImageKey = searchCharacterData.getCharacterData(character.name).icon;

            const charIcon: Phaser.GameObjects.Image = this.scene.add.image(0, 0, iconImageKey);
            charIcon.name = character.name;
            charIcon.setOrigin(0);
            charIcon.setPosition(nextCharacterX, nextCharacterY);
            this.charIconList.push(charIcon);

            const columnX = nextCharacterX + charIcon.width + 10;
            let columnWidth = 0;

            // 各キャラクターごとの詳細情報のラベル（Lv, HP, MP）
            const charLabels: Phaser.GameObjects.Text[] = [];

            //項目を作成
            for (const str of this.mainColumn) {
                const msgObj = msgObjInstance.createTextObject(this.scene, columnX, 0, str)
                msgObj.name = str;
                msgObj.setDepth(100);
                msgObj.setStroke('#2d2d2d', 5)
                this.selectList.push(msgObj)
                charLabels.push(msgObj);
                if (columnWidth < msgObj.width) {
                    columnWidth = msgObj.width;
                }
            };
            columnWidth += 5;//項目の右スペースを加算

            const HP = character.data.get('HP');
            const MaxHP = character.data.get('MaxHP');
            const MP = character.data.get('MP');
            const MaxMP = character.data.get('MaxMP');

            const LvColumn = msgObjInstance.createTextObject(this.scene, 0, 0, character.data.get('Lv'));
            const nowHPColmun = msgObjInstance.createTextObject(this.scene, 0, 0, HP);
            const maxHPColmun = msgObjInstance.createTextObject(this.scene, 0, 0, '/ ' + MaxHP);
            const nowMPColmun = msgObjInstance.createTextObject(this.scene, 0, 0, MP);
            const maxMPColmun = msgObjInstance.createTextObject(this.scene, 0, 0, '/ ' + MaxMP);

            LvColumn.setStroke('#2d2d2d', 5)
            nowHPColmun.setStroke('#2d2d2d', 5)
            maxHPColmun.setStroke('#2d2d2d', 5)
            nowMPColmun.setStroke('#2d2d2d', 5)
            maxMPColmun.setStroke('#2d2d2d', 5)

            this.nowHPColmunList.push(nowHPColmun);
            this.nowMPColmunList.push(nowMPColmun);

            let gaugeHP: EnergyGauge;
            let gaugeCaseHP: EnergyGauge;
            let gaugeMP: EnergyGauge;
            let gaugeCaseMP: EnergyGauge;

            // 右端の計算用
            let currentCharacterWidth = (columnX - nextCharacterX) + columnWidth;

            //値配置及びゲージ作成配置。項目を基準に配置する。
            charLabels.forEach((obj, index) => {
                obj.y = nextCharacterY + index * (obj.height + obj.lineSpacing);
                if (obj.name === 'Lv') {
                    LvColumn.x = obj.x + 40;
                    LvColumn.y = obj.y;
                }
                if (obj.name === 'HP') {
                    nowHPColmun.x = obj.x + 70;
                    nowHPColmun.y = obj.y;
                    maxHPColmun.x = nowHPColmun.x + 32;
                    maxHPColmun.y = nowHPColmun.y;
                    gaugeCaseHP = new EnergyGauge(this.scene, character, 'MaxHP');
                    gaugeCaseHP.setPosition(obj.x + 40, obj.y + 2);
                    gaugeHP = new EnergyGauge(this.scene, character, 'HP');
                    gaugeHP.setPosition(obj.x + 40, obj.y + 2);
                }
                if (obj.name === 'MP') {
                    nowMPColmun.x = obj.x + 70;
                    nowMPColmun.y = obj.y;
                    maxMPColmun.x = nowMPColmun.x + 32;
                    maxMPColmun.y = nowMPColmun.y;
                    gaugeCaseMP = new EnergyGauge(this.scene, character, 'MaxMP');
                    gaugeCaseMP.setPosition(obj.x + 40, obj.y + 2);
                    gaugeMP = new EnergyGauge(this.scene, character, 'MP');
                    gaugeMP.setPosition(obj.x + 40, obj.y + 2);

                    const rightEdge = (obj.x - nextCharacterX) + 40 + gaugeCaseMP.getWidth();
                    if (currentCharacterWidth < rightEdge) {
                        currentCharacterWidth = rightEdge;
                    }
                }
            });

            const columnlist = [
                charIcon,
                (gaugeCaseHP! as Phaser.GameObjects.Graphics),
                (gaugeHP! as Phaser.GameObjects.Graphics),
                (gaugeCaseMP! as Phaser.GameObjects.Graphics),
                (gaugeMP! as Phaser.GameObjects.Graphics),
                LvColumn,
                nowHPColmun,
                maxHPColmun,
                nowMPColmun,
                maxMPColmun,
                ...charLabels
            ];
            this.add(columnlist);

            this.characterObject.set(character.name, {
                obj: {
                    CharacterIcon: charIcon,
                    nowHPText: nowHPColmun,
                    maxHPText: maxHPColmun,
                    nowMPText: nowMPColmun,
                    maxMPText: maxMPColmun
                }
            })

            //HPが0以下の場合はグレーアウト
            if (HP <= 0) {
                charIcon.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
            }

            // 次のキャラクターの表示用X座標を更新
            nextCharacterX += currentCharacterWidth + 30; // キャラクター間の隙間を追加
        }

        this.setVisible(false);
    }

    show() { this.setVisible(true); }
    move() { }
    hide() { }


    //キャラクター名から戦闘画面のオブジェクトを取得
    public getCharacterIcon(characterName: string): Phaser.GameObjects.Image {
        return this.characterObject.get(characterName)!.obj.CharacterIcon;
    }

    //選択中キャラクターを点滅
    lightUpDown(characterName: string) {
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

                //キャラクターアイコンを検索し点滅処理
                this.characterObject.get(characterName)!.obj.CharacterIcon.setTint(Phaser.Display.Color.GetColor(value, value, value));
            },
        });
    }

    public deleteNowLightUpDown(characterName: string) {
        this.lightUpDownTween.destroy();

        //現在点滅中のアイコンの点滅を停止
        this.characterObject.get(characterName)!.obj.CharacterIcon.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
    }

    public lightUp(characterName: string) {
        this.characterObject.get(characterName)!.obj.CharacterIcon.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
    }

    public lightDown(characterName: string) {
        this.characterObject.get(characterName)!.obj.CharacterIcon.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
    }

}
