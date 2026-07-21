import { PlayerData } from "../lib/PlayerDataTypes";
import { OptionData } from "../lib/FieldTypes";
import { GameStateManager } from "../core/GameStateManager";
import { SaveDataManager } from "./SaveDataManager";
import { Player } from "../field/view/character/Player";

export class CacheDataUpdate {
    private saveDataManager: SaveDataManager;

    constructor(
        private scene: Phaser.Scene) {
        this.saveDataManager = new SaveDataManager();
    }

    public async phaserCacheDataUpdate(): Promise<void> {
        const manager = GameStateManager.getInstance();
        const savedata = this.scene.cache.json.get('savedata');

        //オプションデータの同期
        const savedataOption = this.scene.cache.json.get('savedata').OptionData as OptionData;
        savedataOption.masterVolume = manager.currentOptionData.masterVolume;
        savedataOption.bgmVolume = manager.currentOptionData.bgmVolume;
        savedataOption.seVolume = manager.currentOptionData.seVolume;
        savedataOption.bgsVolume = manager.currentOptionData.bgsVolume;
        savedataOption.textSpeed = manager.currentOptionData.textSpeed;

        //描画モードの同期
        (this.scene.cache.json.get('savedata').HighDraw as boolean) = manager.isHighDraw;

        //仮想パッド情報の同期
        (this.scene.cache.json.get('savedata').VirtualPad as boolean) = manager.isVirtualPad;

        //クリア情報の同期
        (this.scene.cache.json.get('savedata').GameClearFlg as boolean) = manager.isGameClearFlg;

        // プレイヤーデータの同期
        const partyList = manager.currentPlayerPartyList;

        if (partyList.length === 0) return;

        // 1人目のプレイヤー
        const mainPlayer = partyList[0];

        const now = new Date();
        const dateTimeString = now.toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
        });
        savedata.infomation = `中断セーブデータ ${dateTimeString}`;

        savedata.playerData.PlayerMapKey = manager.currentFieldData.mapKey;
        savedata.playerData.PlayerPosition.x = mainPlayer.x;
        savedata.playerData.PlayerPosition.y = mainPlayer.y;
        savedata.playerData.initStandKey = (mainPlayer as Player).getAnimationKey().standframe;

        // 1人目のデータ同期
        this.syncPlayerData(mainPlayer, savedata.playerData, true);

        // 2人目のデータ同期
        if (partyList.length > 1) {
            this.syncPlayerData(partyList[1], savedata.playerData2, false);
        }

        // 3人目のデータ同期
        if (partyList.length > 2) {
            this.syncPlayerData(partyList[2], savedata.playerData3, false);
        }
    }

    private syncPlayerData(player: Phaser.GameObjects.Sprite, targetData: PlayerData, isMainPlayer: boolean) {
        if (!player || !targetData) return;

        // ステータスを同期
        const status = targetData.status;
        if (status) {
            for (const key in status) {
                if (player.data.has(key)) {
                    status[key as keyof typeof status] = player.data.get(key);
                }
            }
        }

        // 装備を同期
        const equip = targetData.Equip;
        if (equip) {
            for (const key in equip) {
                if (player.data.has(key)) {
                    equip[key as keyof typeof equip] = player.data.get(key);
                }
            }
        }

        // スキルを同期
        const skill = targetData.Skill;
        if (skill) {
            for (const key in skill) {
                if (player.data.has(key)) {
                    skill[key as keyof typeof skill] = player.data.get(key);
                }
            }
        }

        // アイテムを同期（メインプレイヤーのみ）
        if (isMainPlayer) {
            const items = targetData.Item;
            if (items) {
                for (const key in items) {
                    if (player.data.has(key)) {
                        items[key] = player.data.get(key);
                    } else {
                        // player.data に存在しない（個数0で削除された）場合はセーブデータからも削除
                        delete items[key];
                    }
                }

                // cache.savedataのItemに存在しない項目を追加
                for (const key in player.data.list) {
                    if (!items.hasOwnProperty(key)) {
                        if (this.saveDataManager.checkItemListData(key)) {
                            items[key] = player.data.get(key);
                        }
                    }
                }
            }
        }
    }
}