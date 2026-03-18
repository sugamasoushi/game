/**
 * セーブデータはlocalstrageに格納する
 * savedate.jsonは初期データとして使用する。
 */

export class SaveDataManager {
    constructor() { }

    //セーブデータをローカルストレージまたはElectronに書き込み
    public async setSaveData(scene: Phaser.Scene) {
        const savedata = scene.cache.json.get('savedata');
        if (window.electronAPI) {
            await window.electronAPI.saveData(savedata);
        } else {
            localStorage.setItem('savedata', JSON.stringify(savedata));
        }
    }

    //セーブデータをローカルストレージまたはElectronから読み込み
    public async loadSaveData(scene: Phaser.Scene) {
        let savedata;
        if (window.electronAPI) {
            savedata = await window.electronAPI.loadData();
            if (typeof savedata === 'string') {
                try {
                    savedata = JSON.parse(savedata);
                } catch(e) {}
            }
        } else {
            const localData = localStorage.getItem('savedata');
            if (localData) {
                savedata = JSON.parse(localData);
            }
        }

        //データが存在する場合
        if (savedata) {
            console.log("Loaded Savedata: ", savedata);
            // 既存のキャッシュデータを取得
            const currentSaveData = scene.cache.json.get('savedata');
            
            // ローカルストレージ または JSON から読み込んだデータをゲーム内のメモリに完全に上書き（マージ）する
            if (currentSaveData) {
                Object.assign(currentSaveData, savedata);
            }
        }
    }

}