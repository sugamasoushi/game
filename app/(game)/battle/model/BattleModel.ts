import { BattleScene, FieldScene, CharacterStatus } from "../../lib/types";
import { Npc } from "../../field/view/character/Npc";
import { SearchEnemyData } from "../../Data/SearchEnemyData";
import { SearchTileMapData } from "../../Data/SearchTileMapData";
import { gameStateManager } from "../../core/GameStateManager";

export class BattleModel {
    private battleScene: BattleScene;
    private gameScene: FieldScene;
    private canNotRunaway: boolean = false;
    private enemyList: string[] = [];//イベント戦闘の敵名称等
    public enemyPartyList: Phaser.GameObjects.Image[] = [];

    private fieldHitEnemy: Npc | null | undefined;

    constructor(
        battleScene: BattleScene,
        data: {
            enemyDataList: string[] | null | undefined,
            fieldHitEnemy: Npc | null | undefined,
            canNotRunaway: boolean
        }
    ) {
        this.battleScene = battleScene;
        this.gameScene = (this.battleScene.scene.get('Field') as FieldScene);
        this.canNotRunaway = data.canNotRunaway;
        this.fieldHitEnemy = data.fieldHitEnemy;

        this.enemyPartyList = [];

        //敵パーティを作成
        if (data.fieldHitEnemy) {
            this.createEnemyDataFieldHit(data.fieldHitEnemy);

            // フィールドの敵を消去
            data.fieldHitEnemy.destroy();
        }

        if (data.enemyDataList) {
            this.createEnemyDataFromList(data.enemyDataList);
        }

        //いずれの指定が無い場合
        if ((data.fieldHitEnemy === undefined || data.fieldHitEnemy === null) &&
            (data.enemyDataList === undefined || data.enemyDataList === null)
        ) {
            this.createEnemyDataAuto();
        }
    }

    //通常戦闘の敵データを作成
    public createEnemyDataFieldHit(fieldHitEnemy: Npc) {
        const searchEnemyData = new SearchEnemyData(this.gameScene.cache.json);
        const searchTileMapData = new SearchTileMapData(this.gameScene.cache.json);

        //敵数をランダムで作成
        const enemyValue = new Phaser.Math.RandomDataGenerator().between(1, 2);
        //const enemyValue = 1;
        //const enemyValue = 2;

        for (let i = 0; i < enemyValue; i++) {

            //シンボルエンカウントした1体のみデータを引き継ぐ
            if (i === 0) {
                const data: CharacterStatus = {
                    level: fieldHitEnemy.getData('Level'),
                    HP: fieldHitEnemy.getData('HP'),
                    MP: fieldHitEnemy.getData('MP'),
                    MaxHP: fieldHitEnemy.getData('MaxHP'),
                    MaxMP: fieldHitEnemy.getData('MaxMP'),
                    Attack: fieldHitEnemy.getData('Attack'),
                    Guard: fieldHitEnemy.getData('Guard'),
                    Speed: fieldHitEnemy.getData('Speed'),
                    gold: fieldHitEnemy.getData('gold')
                }

                //敵オブジェクトは画像オブジェクトのdataを利用する
                const npcImageObject = this.battleScene.add.image(0, 0, fieldHitEnemy.getData('ImageKey'));
                npcImageObject.setData(data);
                npcImageObject.setData('NpcType', 'enemy');
                npcImageObject.setData('Name', searchEnemyData.getEnemyName(fieldHitEnemy.getData('ImageKey')));
                // enemy.nameは設定済み;

                this.enemyPartyList.push(npcImageObject);

            } else {
                const mapkey = gameStateManager.currentFieldData.mapKey
                const mapEnemyList = searchTileMapData.getMapEnemyList(mapkey)

                let enemyDataKey;

                // リストからランダムに1つ選ぶ
                const randomIndex = Math.floor(Math.random() * mapEnemyList!.EnemyList.length);
                enemyDataKey = mapEnemyList!.EnemyList[randomIndex];

                // 50%出現の敵キャラクターが設定されている場合
                if (mapEnemyList?.Appearance50) {
                    if (Math.random() < 0.5) {

                        //敵キャラクターを上書き
                        enemyDataKey = mapEnemyList?.Appearance50;
                    }
                }

                //2体目以降はenemydataからステータスを作成
                const enemyKey = enemyDataKey!;
                const enemyData = searchEnemyData.getEnemyData(enemyKey);
                const enemy = this.battleScene.add.image(0, 0, enemyKey);
                enemy.setData('ImageKey', enemyKey);
                enemy.setData('NpcType', 'enemy');

                enemy.setData({
                    level: enemyData!.Level,
                    HP: enemyData!.HP,
                    MP: enemyData!.MP,
                    MaxHP: enemyData!.MaxHP,
                    MaxMP: enemyData!.MaxMP,
                    Attack: enemyData!.Attack,
                    Guard: enemyData!.Guard,
                    Speed: enemyData!.Speed,
                    gold: enemyData!.gold
                });
                enemy.setData('Name', enemyData!.Name);
                enemy.name = enemyKey;

                this.enemyPartyList.push(enemy);
            }
        }
    }

    //データ指定で作成
    public createEnemyDataFromList(enemyDataList: string[]) {
        const searchEnemyData = new SearchEnemyData(this.gameScene.cache.json);

        //敵キャラクター指定
        for (const enemyKey of enemyDataList) {

            const ImageKey = searchEnemyData.getEnemyData(enemyKey)!.ImageKey;
            const enemy = this.battleScene.add.image(0, 0, ImageKey);
            enemy.setData('ImageKey', ImageKey);
            enemy.setData('NpcType', 'enemy');

            const enemyData = searchEnemyData.getEnemyData(enemyKey);
            const data: CharacterStatus = {
                level: enemyData!.Level,
                HP: enemyData!.HP,
                MP: enemyData!.MP,
                MaxHP: enemyData!.MaxHP,
                MaxMP: enemyData!.MaxMP,
                Attack: enemyData!.Attack,
                Guard: enemyData!.Guard,
                Speed: enemyData!.Speed,
                gold: enemyData!.gold
            }
            enemy.setData(data);

            //名前の検索と設定
            enemy.setData('Name', enemyData!.Name);
            enemy.name = ImageKey;
            this.enemyPartyList.push(enemy);
        }
    }

    //マップごとに登録したデータから作成
    public createEnemyDataAuto() {
        const searchEnemyData = new SearchEnemyData(this.gameScene.cache.json);
        const searchTileMapData = new SearchTileMapData(this.gameScene.cache.json);

        const mapkey = gameStateManager.currentFieldData.mapKey
        const mapEnemyList = searchTileMapData.getMapEnemyList(mapkey)

        //敵数をランダムで作成
        const enemyMaxNum = new Phaser.Math.RandomDataGenerator().between(1, 2);

        for (let i = 0; i < enemyMaxNum; i++) {

            let enemyDataKey;

            // リストからランダムに1つ選ぶ
            const randomIndex = Math.floor(Math.random() * mapEnemyList!.EnemyList.length);
            enemyDataKey = mapEnemyList!.EnemyList[randomIndex];

            // 50%出現の敵キャラクターが設定されている場合
            if (mapEnemyList?.Appearance50) {
                if (Math.random() < 0.5) {

                    //敵キャラクターを上書き
                    enemyDataKey = mapEnemyList?.Appearance50;
                }
            }

            //enemydataからステータスを作成
            const enemyKey = enemyDataKey!;
            const enemyData = searchEnemyData.getEnemyData(enemyKey);
            const enemy = this.battleScene.add.image(0, 0, enemyKey);
            enemy.setData('ImageKey', enemyKey);
            enemy.setData('NpcType', 'enemy');

            if (enemyData) {
                enemy.setData({
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
                enemy.setData('Name', enemyData.Name);
            }
            this.enemyPartyList.push(enemy);
        }
    }

    public getPlayerPartyList(): Phaser.GameObjects.Sprite[] { return gameStateManager.currentPlayerPartyList; }
    public getEnemyList(): string[] { return this.enemyList; }
    public getCanNotRunaway(): boolean { return this.canNotRunaway; }
    public getEnemyPartyList(): Phaser.GameObjects.Image[] { return this.enemyPartyList; }

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

    public resetBattleStatus() {
        for (const partyMember of gameStateManager.currentPlayerPartyList) {
            partyMember.data.remove('GuardValue');
            partyMember.data.remove('SkillType');
            partyMember.data.remove('UseSkill');
            partyMember.data.remove('BattleTarget');
            partyMember.data.remove('BattleTargetIcon');
            partyMember.data.remove('attackType');
            partyMember.data.remove('avoid');
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

