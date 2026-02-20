import { GameScene, BattleScene } from "../../lib/types";
import { MessageObject } from "../../util/MessageObject";
import { EnergyGauge } from "../../util/EnergyGauge";
import { CharacterGameObject } from '../../event/view/CharacterGameObject';
import { DataDefinition } from '../../Data/DataDefinition';

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

    public createBattleCharacterIcon(partyList: string[], x: number, y: number) {
        this.partyList = partyList;
        this.x = x;
        this.y = y;

        const settingData = new DataDefinition();

        const msgObjInstance = new MessageObject();
        msgObjInstance.init(this.scene);

        const gameScene = (this.scene.scene.get('Game') as GameScene);
        const characterGameObjectInstance = new CharacterGameObject();

        let nextCharacterX = 0;
        const nextCharacterY = 0;

        for (const [index, character] of Object.entries(partyList)) {

            //キャラクターデータを保持しているフィールドのスプライトを取得
            const characterSprite: Phaser.Physics.Arcade.Sprite = characterGameObjectInstance.getSprite(gameScene, character);

            const imageKey = settingData.getCharacterImageKey(this.scene, character)!.normal;
            const charIcon: Phaser.GameObjects.Image = this.scene.add.image(0, 0, 'Icon_' + imageKey);
            charIcon.name = character;
            charIcon.setOrigin(0);
            charIcon.setPosition(nextCharacterX, nextCharacterY);
            this.charIconList.push(charIcon);

            const columnX = charIcon.width + 10
            let columnWidth = 0;

            //項目を作成
            for (const str of this.mainColumn) {
                const msgObj = msgObjInstance.createTextObject(this.scene, columnX, 0, str)
                msgObj.name = str;
                msgObj.setDepth(100);
                msgObj.setStroke('#2d2d2d', 5)
                this.selectList.push(msgObj)
                if (columnWidth < msgObj.width) {
                    columnWidth = msgObj.width;
                }
            };
            columnWidth += 5;//項目の右スペースを加算

            const HP = characterSprite.data.get('HP');
            const MaxHP = characterSprite.data.get('MaxHP');
            const MP = characterSprite.data.get('MP');
            const MaxMP = characterSprite.data.get('MaxMP');

            const LvColumn = msgObjInstance.createTextObject(this.scene, 0, 0, characterSprite.data.get('Lv'));
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

            //右下座標
            let zoneWidth = columnX + columnWidth;
            // const zoneHeight = charIcon.height;

            //値配置及びゲージ作成配置。項目を基準に配置する。
            this.selectList.forEach((obj, index) => {
                obj.y = index * (obj.height + obj.lineSpacing);
                if (obj.name === 'Lv') {
                    LvColumn.x = obj.x + 40;
                    LvColumn.y = obj.y;
                }
                if (obj.name === 'HP') {
                    nowHPColmun.x = obj.x + 70;
                    nowHPColmun.y = obj.y;
                    maxHPColmun.x = nowHPColmun.x + 32;
                    maxHPColmun.y = nowHPColmun.y;
                    gaugeCaseHP = new EnergyGauge(this.scene, characterSprite, 'MaxHP');
                    gaugeCaseHP.setPosition(obj.x + 40, obj.y + 2);
                    gaugeHP = new EnergyGauge(this.scene, characterSprite, 'HP');
                    gaugeHP.setPosition(obj.x + 40, obj.y + 2);
                }
                if (obj.name === 'MP') {
                    nowMPColmun.x = obj.x + 70;
                    nowMPColmun.y = obj.y;
                    maxMPColmun.x = nowMPColmun.x + 32;
                    maxMPColmun.y = nowMPColmun.y;
                    gaugeCaseMP = new EnergyGauge(this.scene, characterSprite, 'MaxMP');
                    gaugeCaseMP.setPosition(obj.x + 40, obj.y + 2);
                    gaugeMP = new EnergyGauge(this.scene, characterSprite, 'MP');
                    gaugeMP.setPosition(obj.x + 40, obj.y + 2);

                    zoneWidth += gaugeCaseMP.getWidth();
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
                maxMPColmun];
            this.add(columnlist);

            //クリックゾーン作成
            //※未使用だが一応残す。キャラ順番を選択する場合は使用する。
            //const clickZone = this.scene.add.zone(0, 0, zoneWidth, zoneHeight).setName('charcterClickZone' + index);
            //clickZone.setInteractive({ useHandCursor: true });
            //clickZone.setOrigin(0);
            //clickZone.x = 0;
            //clickZone.y = 0;
            //this.add(clickZone);

            this.add(this.selectList);

            //次キャラクターのx座標を更新
            nextCharacterX = zoneWidth + 10;

            this.characterObject = new Map();
            this.characterObject.set(character, {
                obj: {
                    CharacterIcon: charIcon,
                    // clickZone: clickZone,
                    nowHPText: nowHPColmun,
                    maxHPText: maxHPColmun,
                    nowMPText: nowMPColmun,
                    maxMPText: maxMPColmun
                }
            })
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

    public lightUp() {
        this.selectList.forEach(list => {
            list.setTint(Phaser.Display.Color.GetColor(255, 255, 255));
        });
    }

    public lightDown() {
        this.selectList.forEach(list => {
            list.setTint(Phaser.Display.Color.GetColor(128, 128, 128));
        });
    }

}
