/**
 * セーブデータはlocalstrageに格納する
 * savedate.jsonは初期データとして使用する。
 */

export class SaveDataManager {
    constructor() { }

    //セーブデータをローカルストレージまたはElectronに書き込み
    public async setSaveData(scene: Phaser.Scene) {
        const savedata = scene.cache.json.get('savedata');
        //console.log(savedata);
        if (window.electronAPI) {
            await window.electronAPI.clearSaveData();
            await window.electronAPI.saveData(savedata);
        } else {
            localStorage.removeItem('savedata');
            localStorage.setItem('savedata', JSON.stringify(savedata));
        }
    }

    //セーブデータをローカルストレージまたはElectronから読み込み
    public async loadSaveData(scene: Phaser.Scene): Promise<boolean> {
        let result = false;

        let savedata;
        if (window.electronAPI) {
            savedata = await window.electronAPI.loadData();
            if (typeof savedata === 'string') {
                try {
                    savedata = JSON.parse(savedata);
                } catch (e) {
                    console.error("Failed to parse savedata from Electron:", e);
                }
            }
        } else {
            const localData = localStorage.getItem('savedata');
            if (localData) {
                savedata = JSON.parse(localData);
            }
        }

        //データが存在する場合
        if (savedata) {
            //console.log("Loaded Savedata: ", savedata);
            // 既存のキャッシュデータを取得
            const currentSaveData = scene.cache.json.get('savedata');

            // ローカルストレージ または JSON から読み込んだデータをゲーム内のメモリに完全に上書き（マージ）する
            if (currentSaveData) {
                Object.assign(currentSaveData, savedata);
            }
            result = true;
        }
        return result;
    }


    /**
     * アイテムリストのチェック
     * セーブデータはsavedata.jsonの形式となるが、setData()でGameObjectに設定すると階層構造が変わってしまう。
     * そのため、全項目参照するような処理する際には必ずチェックする事。
     * 
     * setData()で設定しているキーが増えるたびに条件を追加していく
     * Phaserの処理をそのまま使用する前提のためこのような処理になっている
     * 将来的には別途管理処理を作成するかもしれない
     */
    public checkItemListData(dataName: string) {
        let chekResult: boolean = false;

        if (dataName !== 'Lv' && dataName !== 'HP' && dataName !== 'MP' && dataName !== 'MaxHP' && dataName !== 'MaxMP' &&
            dataName !== 'Attack' && dataName !== 'Guard' && dataName !== 'Speed' &&
            dataName !== 'Weapon' && dataName !== 'Armor' &&
            dataName !== 'special' && dataName !== 'magic' &&
            dataName !== 'name' && dataName !== 'ImageKey' && dataName !== 'NpcType' && dataName !== 'BattleTarget' &&
            dataName !== 'BattleTargetIcon' && dataName !== 'skilldata' && dataName !== 'SkillType' && dataName !== 'UseSkill'

        ) {
            chekResult = true;
        }

        return chekResult;
    }

}