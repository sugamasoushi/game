/**
 * セーブデータはlocalstrageに格納する
 * savedate.jsonは初期データとして使用する。
 */

export class SaveDataManager {
    constructor() { }

    //セーブデータをローカルストレージに書き込み
    public setSaveData(scene: Phaser.Scene) {
        const savedata = scene.cache.json.get('savedata');
        localStorage.setItem('savedata', JSON.stringify(savedata));
    }

    //セーブデータをローカルストレージから読み込み
    public loadSaveData(scene: Phaser.Scene) {

        //console.log(localStorage.getItem('savedata'))

        //ローカルストレージにデータが存在する場合
        if (localStorage.getItem('savedata')) {

            const savedata = localStorage.getItem('savedata');
            console.log(JSON.parse(savedata!))
            scene.cache.json.get('savedata').playerData.PlayerMapKey = JSON.parse(savedata!).playerData.PlayerMapKey;
            scene.cache.json.get('savedata').playerData.PlayerPosition.x = JSON.parse(savedata!).playerData.PlayerPosition.x;
            scene.cache.json.get('savedata').playerData.PlayerPosition.y = JSON.parse(savedata!).playerData.PlayerPosition.y;
        }
    }

}