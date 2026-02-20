import { BattleScene, GameScene, CharacterStatus } from "../../lib/types";
import { CharacterGameObject } from "../../event/view/CharacterGameObject";
import { Npc } from "../../gamemain/view/character/Npc";
import { FieldEnemyNameData } from "../../Data/NameData";

export class BattleModel {
    private battleScene: BattleScene;
    private gameScene: GameScene;
    private usePatern: string;
    private canNotRunaway: boolean = false;

    private characterGameObject: CharacterGameObject;
    private partyList: string[] = ['player'];//現状はプレイヤーのみ
    private playerPartyList: Phaser.GameObjects.Sprite[] = [];//現状はプレイヤーのみ
    private playerPartyMap: Map<string, Phaser.GameObjects.Sprite>;//マップと配列のどちらが良いか...？　色々考えたが番号で簡単に指定できる配列の方が良さそう。
    private nowSelectPartyMemberNo: number = 0;//左から数えた値

    private enemyList: string[] = [];//イベント戦闘の敵名称等
    private enemyPartyMap: Map<string, Phaser.GameObjects.Image>;
    private fieldHitEnemy: Npc;

    constructor(battleScene: BattleScene, data: { usePatern: string, fieldHitEnemy: Npc, canNotRunaway: boolean }) {
        this.battleScene = battleScene;
        this.gameScene = (this.battleScene.scene.get('Game') as GameScene);
        this.usePatern = data.usePatern;
        this.canNotRunaway = data.canNotRunaway;
        this.characterGameObject = new CharacterGameObject();
        this.fieldHitEnemy = data.fieldHitEnemy;

        //敵味方パーティを作成
        this.createBattlePartyData();
        if (this.usePatern === 'normal') {
            this.createBattleEnemyData();
        } else {
            this.createEventBattleEnemyData();
        }
    }

    public createBattlePartyData() {
        this.playerPartyMap = new Map();
        for (const name of this.partyList) {
            this.playerPartyMap.set(name, this.characterGameObject.getSprite(this.gameScene, name));
            this.playerPartyList.push(this.characterGameObject.getSprite(this.gameScene, name));
        }
    }

    //通常戦闘の敵データを作成
    public createBattleEnemyData() {
        this.enemyPartyMap = new Map();

        //敵数をランダムで作成
        const enemyValue = new Phaser.Math.RandomDataGenerator().between(1, 2);
        // const enemyValue = 2;

        for (let i = 0; i < enemyValue; i++) {

            //シンボルエンカウントした1体のみデータを引き継ぐ
            if (i === 0) {
                const data: CharacterStatus = {
                    level: this.fieldHitEnemy.getData('level'),
                    HP: this.fieldHitEnemy.getData('HP'),
                    MP: this.fieldHitEnemy.getData('MP'),
                    MaxHP: this.fieldHitEnemy.getData('MaxHP'),
                    MaxMP: this.fieldHitEnemy.getData('MaxMP'),
                    Attack: this.fieldHitEnemy.getData('Attack'),
                    Guard: this.fieldHitEnemy.getData('Guard'),
                    Speed: this.fieldHitEnemy.getData('Speed'),
                    gold: this.fieldHitEnemy.getData('gold')
                }

                //画像キー：画像　の形式で格納
                this.enemyPartyMap.set(this.fieldHitEnemy.getData('ImageKey'), this.battleScene.add.image(0, 0, this.fieldHitEnemy.getData('ImageKey')));
                this.enemyPartyMap.get(this.fieldHitEnemy.getData('ImageKey'))?.setData(data);
                this.enemyPartyMap.get(this.fieldHitEnemy.getData('ImageKey'))?.setData('NpcType', 'enemy');

                //名前の検索と設定
                const key = this.fieldHitEnemy.getData('ImageKey');
                const name = FieldEnemyNameData[key as keyof typeof FieldEnemyNameData];
                this.enemyPartyMap.get(this.fieldHitEnemy.getData('ImageKey'))?.setData('name', name);
                this.enemyPartyMap.get(this.fieldHitEnemy.getData('ImageKey'))?.setName(name);

                this.fieldHitEnemy.deleteCharacter();

            } else {
                //2体目以降
                const lamia = this.battleScene.add.image(0, 0, 'enemy01');

                lamia.name = 'enemy01';
                // lamia.npcType = 'enemy';
                // lamia.imageKey = 'enemy01';
                lamia.setData({
                    level: 2,
                    HP: 50,
                    MP: 0,
                    MaxHP: 50,
                    MaxMP: 0,
                    Attack: 40,//40
                    Guard: 1,
                    Speed: 5,
                    gold: 2
                });

                lamia.setData('NpcType', 'enemy');

                this.enemyPartyMap.set(lamia.name, lamia);

                //名前の検索と設定
                const key = lamia.name;
                const name = FieldEnemyNameData[key as keyof typeof FieldEnemyNameData];
                lamia.setData('name', name);

                this.enemyPartyMap.get(this.fieldHitEnemy.getData('ImageKey'))?.setName(name);

            }
        }
    }

    //イベント戦闘の敵データを作成
    public createEventBattleEnemyData() {
        this.enemyPartyMap = new Map();

        //イベントから呼び出された場合、とりあえず一体のみ
        const lamy = this.battleScene.add.image(0, 0, 'enemy00');
        lamy.name = 'enemy00';
        const data: CharacterStatus = {
            level: this.fieldHitEnemy.getData('level'),
            HP: this.fieldHitEnemy.getData('HP'),
            MP: this.fieldHitEnemy.getData('MP'),
            MaxHP: this.fieldHitEnemy.getData('MaxHP'),
            MaxMP: this.fieldHitEnemy.getData('MaxMP'),
            Attack: this.fieldHitEnemy.getData('Attack'),
            Guard: this.fieldHitEnemy.getData('Guard'),
            Speed: this.fieldHitEnemy.getData('Speed'),
            gold: this.fieldHitEnemy.getData('gold')
        }

        lamy.setData(data);
        lamy.setData('NpcType', 'enemy');

        this.enemyPartyMap.set(lamy.name, lamy);

        //名前の検索と設定
        const key = lamy.name;
        const name = FieldEnemyNameData[key as keyof typeof FieldEnemyNameData];
        lamy.setData('name', name);
        
        this.enemyPartyMap.get(this.fieldHitEnemy.getData('ImageKey'))?.setName(name);
    }

    public getPartyList(): string[] { return this.partyList; }
    public getPlayerPartyList(): Phaser.GameObjects.Sprite[] { return this.playerPartyList; }
    public getEnemyList(): string[] { return this.enemyList; }

    public getNowSelectCharacterName(): string {
        return this.partyList[this.nowSelectPartyMemberNo];
    }

    public getNowSelectCharacterSprite(): Phaser.Physics.Arcade.Sprite {
        return this.characterGameObject.getSprite(this.gameScene, this.getNowSelectCharacterName());
    }

    //戦闘の選択継続のチェックと選択中キャラ番号の更新
    public continueBattleSelectAndUpadateSelectNo(): boolean {
        this.nowSelectPartyMemberNo++;
        if (this.partyList.length === this.nowSelectPartyMemberNo) {
            this.nowSelectPartyMemberNo = 0;
            return false;
        }
        return true;
    }

    public getSprite(characterName: string): Phaser.Physics.Arcade.Sprite {
        return this.characterGameObject.getSprite(this.gameScene, characterName);
    }

    public getCanNotRunaway(): boolean { return this.canNotRunaway; }

    public getPlayerParty(): Map<string, Phaser.GameObjects.Image> { return this.playerPartyMap; }
    public getEnemyParty(): Map<string, Phaser.GameObjects.Image> { return this.enemyPartyMap; }
    public getFieldHitEnemy(): Npc { return this.fieldHitEnemy }

    public getBattlerList() {

        //味方のマップを配列に変換
        const partyeList: Phaser.GameObjects.GameObject[] = []
        this.playerPartyMap.forEach(enemy => {
            partyeList.push(enemy);
        })

        //敵のマップを配列に変換
        const enemyList: Phaser.GameObjects.GameObject[] = []
        this.enemyPartyMap.forEach(enemy => {
            enemyList.push(enemy);
        })

        //プレイヤーパーティ＋敵の配列
        const battlerList = partyeList.concat(enemyList);
        return battlerList;
    }

    public setEnemyAttackTarget(characterIcon: Phaser.GameObjects.Image) {

        //ターゲットや攻撃方法の決定処理を作成する

        //現時点ではプレイヤーのみ対象
        this.enemyPartyMap.forEach(list => {

            //対象を決定
            //const playerPartyNum = new Phaser.Math.RandomDataGenerator().between(1, 2);
            const playerPartyNum = 0;

            Array.from(this.playerPartyMap.entries()).forEach(([key, value], index) => {
                if (index === playerPartyNum) {
                    // console.log(index, key, value);
                    list.setData('attackType', 'normal');
                    list.setData('BattleTarget', value);
                    list.setData('BattleTargetIcon', characterIcon);
                }
            });
        })
    }

    public deleteEnemy() {
        this.enemyPartyMap.forEach(enemy => {
            // enemy.getData('backGaugeHP').setVisible(false);
            // enemy.getData('gaugeHP').setVisible(false);
            enemy.destroy();
        })
    }

    public getUsePatern() {
        return this.usePatern;
    }

}

