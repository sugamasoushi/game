import { BattleScene, GameScene, CharacterStatus } from "../../lib/types";
import { Npc } from "../../gamemain/view/character/Npc";
import { SearchEnemyData } from "../../Data/SearchEnemyData";
import { gameStateManager } from "../../GameAllState/GameStateManager";

export class BattleModel {
    private battleScene: BattleScene;
    private gameScene: GameScene;
    private usePatern: string;
    private canNotRunaway: boolean = false;
    private enemyList: string[] = [];//イベント戦闘の敵名称等
    public enemyPartyList: Phaser.GameObjects.Image[] = [];

    private fieldHitEnemy: Npc;

    constructor(
        battleScene: BattleScene,
        data: { usePatern: string, fieldHitEnemy: Npc, canNotRunaway: boolean }
    ) {
        this.battleScene = battleScene;
        this.gameScene = (this.battleScene.scene.get('Game') as GameScene);
        this.usePatern = data.usePatern;
        this.canNotRunaway = data.canNotRunaway;
        this.fieldHitEnemy = data.fieldHitEnemy;

        //敵味方パーティを作成
        if (this.usePatern === 'normal') {
            this.createBattleEnemyData();
        } else {
            this.createEventBattleEnemyData();
        }
    }

    //通常戦闘の敵データを作成
    public createBattleEnemyData() {
        this.enemyPartyList = [];
        const searchEnemyData = new SearchEnemyData(this.gameScene.cache.json);

        //敵数をランダムで作成
        const enemyValue = new Phaser.Math.RandomDataGenerator().between(1, 2);
        //const enemyValue = 2;

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

                //敵オブジェクトは画像オブジェクトのdataを利用する
                const npcImageObject = this.battleScene.add.image(0, 0, this.fieldHitEnemy.getData('ImageKey'));
                npcImageObject.setData(data);
                npcImageObject.setData('NpcType', 'enemy');
                npcImageObject.setData('name', searchEnemyData.getEnemyName(this.fieldHitEnemy.getData('ImageKey')));

                this.enemyPartyList.push(npcImageObject);

                this.fieldHitEnemy.deleteCharacter();

            } else {
                //2体目以降はenemydata(enemy01)からステータスを作成
                const enemyKey = 'enemy01';
                const enemyData = searchEnemyData.getEnemyData(enemyKey);
                const enemy = this.battleScene.add.image(0, 0, enemyKey);
                enemy.setData('ImageKey', enemyKey);
                enemy.setData('NpcType', 'enemy');

                if (enemyData) {
                    enemy.setData({
                        level: enemyData.level,
                        HP: enemyData.HP,
                        MP: enemyData.MP,
                        MaxHP: enemyData.MaxHP,
                        MaxMP: enemyData.MaxMP,
                        Attack: enemyData.Attack,
                        Guard: enemyData.Guard,
                        Speed: enemyData.Speed,
                        gold: enemyData.gold
                    });
                    enemy.setData('name', enemyData.name);
                } else {
                    enemy.setData('name', searchEnemyData.getEnemyName(enemyKey));
                }
                this.enemyPartyList.push(enemy);
            }
        }
    }

    //イベント戦闘の敵データを作成
    public createEventBattleEnemyData() {
        this.enemyPartyList = [];
        const searchEnemyData = new SearchEnemyData(this.gameScene.cache.json);

        //console.log(this.fieldHitEnemy)

        //イベントから呼び出された場合、とりあえず一体のみ
        const enemy = this.battleScene.add.image(0, 0, this.fieldHitEnemy.getData('ImageKey'));
        enemy.setData('ImageKey', this.fieldHitEnemy.getData('ImageKey'));
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

        enemy.setData(data);
        enemy.setData('NpcType', 'enemy');

        //名前の検索と設定
        enemy.setData('name', searchEnemyData.getEnemyName(enemy.getData('ImageKey')));
        this.enemyPartyList.push(enemy);
    }

    public getPlayerPartyList(): Phaser.GameObjects.Sprite[] { return gameStateManager.currentPlayerPartyList; }
    public getEnemyList(): string[] { return this.enemyList; }
    public getCanNotRunaway(): boolean { return this.canNotRunaway; }
    public getEnemyPartyList(): Phaser.GameObjects.Image[] { return this.enemyPartyList; }
    public getFieldHitEnemy(): Npc { return this.fieldHitEnemy }

    public getBattlerList() {

        //味方のマップを配列に変換
        const partyeList: Phaser.GameObjects.GameObject[] = gameStateManager.currentPlayerPartyList;

        //敵のマップを配列に変換
        const enemyList: Phaser.GameObjects.GameObject[] = this.enemyPartyList;

        //プレイヤーパーティ＋敵の配列
        const battlerList = partyeList.concat(enemyList);
        return battlerList;
    }

    public setEnemyAttackTarget(characterIcon: Phaser.GameObjects.Image) {

        //ターゲットや攻撃方法の決定処理を作成する

        //現時点ではプレイヤーのみ対象
        for (const list of this.enemyPartyList) {

            //対象を決定（現状はHPが残っているプレイヤーをランダムで決定）
            let playerPartyNum = 0;

            // 生存者リストを作成
            const livingPlayers = gameStateManager.currentPlayerPartyList.filter(
                player => player.data.values.HP > 0
            );

            // 生存者の中からランダムに一人選ぶ
            if (livingPlayers.length > 0) {
                playerPartyNum = new Phaser.Math.RandomDataGenerator().between(0, livingPlayers.length - 1);
                const targetPlayer = livingPlayers[playerPartyNum];

                console.log("対象:", targetPlayer);
            } else {
                console.log("生存しているプレイヤーがいません");
            }

            // プレイヤーのパーティリストから対象を決定
            for (const [index, player] of gameStateManager.currentPlayerPartyList.entries()) {
                if (index === playerPartyNum) {
                    list.setData('attackType', 'normal');
                    list.setData('BattleTarget', player);
                    list.setData('BattleTargetIcon', characterIcon);
                }
            }
        }
    }

    public getEnemyAttackTarget() {

        // 生存者リストを作成
        const livingPlayers = gameStateManager.currentPlayerPartyList.filter(
            player => player.data.values.HP > 0
        );

        // 生存者の中からランダムに一人選ぶ
        if (livingPlayers.length > 0) {
            const playerPartyNum = new Phaser.Math.RandomDataGenerator().between(0, livingPlayers.length - 1);
            const targetPlayer = livingPlayers[playerPartyNum];

            // console.log("対象:", targetPlayer);
            return targetPlayer;
            //return livingPlayers[0];
        } else {
            console.log("生存しているプレイヤーがいません");
        }
    }

    public getPlayerAutoAttackTarget() {

        // 生存者リストを作成
        const livingEnemies = this.enemyPartyList.filter(
            enemy => enemy.data.values.HP > 0
        );

        // 生存者の中からランダムに一人選ぶ
        if (livingEnemies.length > 0) {
            const enemyIndex = new Phaser.Math.RandomDataGenerator().between(0, livingEnemies.length - 1);
            const targetEnemy = livingEnemies[enemyIndex];

            //console.log("対象:", targetEnemy);
            return targetEnemy;
        } else {
            console.log("生存している敵がいません");
        }
    }

    public deleteEnemy() {
        for (const enemy of this.enemyPartyList) {
            enemy.destroy();
        }
        this.enemyPartyList = [];
    }

    public getUsePatern() {
        return this.usePatern;
    }

    public resetBattleStatus() {
        for (const partyMember of gameStateManager.currentPlayerPartyList) {
            partyMember.data.remove('GuardValue');
            partyMember.data.remove('SkillType');
            partyMember.data.remove('UseSkill');
            partyMember.data.remove('BattleTarget');
            partyMember.data.remove('BattleTargetIcon');
            partyMember.data.remove('attackType');
        }
    }

    public checkPlayerPartyHP() {
        const partyeList: Phaser.GameObjects.GameObject[] = gameStateManager.currentPlayerPartyList;
        for (const partyMember of partyeList) {
            if (partyMember.data.values.HP <= 0) {
                partyMember.data.values.HP = 1;
            }
        }
    }
}

