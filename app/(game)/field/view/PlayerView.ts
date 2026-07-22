import { FieldScene } from "../../lib/SceneTypes";
import { SearchCharacterData } from "../../Data/SearchCharacterData";
import { CharacterState, MapLayerDepth } from "../../lib/types";
import { TileMap } from "./TileMap";
import { Player } from "./character/Player";
import { GameStateManager } from "../../core/GameStateManager";

export class PlayerView {

    private playerPartyList: Player[] = [];

    constructor(
        private gameScene: FieldScene,
        private tileMap: TileMap
    ) { }

    public update(time: number, delta: number) {
        void time;
        void delta;
    }

    public execute() {
        return new Promise<void>(async (resolve) => {
            const gameStateManager = GameStateManager.getInstance();
            const fieldData = gameStateManager.currentFieldData;

            const playerX = fieldData.x;
            const playerY = fieldData.y;
            const initStandKey = fieldData.initStandKey;

            //プレイヤー作成
            const player: Player = new Player(this.gameScene, playerX, playerY, 'meina', this.tileMap.getMakeTilemap())
            player.state = CharacterState.normal;

            if (initStandKey === 'stand_right') { player.setStandFrame(player.getStandKey('right')); }
            else if (initStandKey === 'stand_left') { player.setStandFrame(player.getStandKey('left')); }
            else if (initStandKey === 'stand_up') { player.setStandFrame(player.getStandKey('up')); }
            else if (initStandKey === 'stand_down') { player.setStandFrame(player.getStandKey('down')); }

            const searchCharacterData = new SearchCharacterData(this.gameScene.cache.json);
            player.setData('name', searchCharacterData.getCharacterData(player.name).name)

            //各種設定
            player.setDataEnabled();
            player.setData(this.gameScene.cache.json.get('savedata').playerData.status);
            player.setData(this.gameScene.cache.json.get('savedata').playerData.Equip);
            player.setData(this.gameScene.cache.json.get('savedata').playerData.Skill);
            player.setData(this.gameScene.cache.json.get('savedata').playerData.Item);
            player.setDepth(MapLayerDepth.High + player.y);

            //プレイヤーと衝突判定の設定
            if (this.tileMap.getCollisionLayer()) {
                this.gameScene.physics.add.collider(player, this.tileMap.getCollisionLayer());
            }

            this.playerPartyList.push(player);

            //プレイヤー2作成
            if (this.gameScene.cache.json.get('savedata').playerData2.PartyMemberFlg) {

                //座標設定されている場合は設定済み座標を、設定されていない場合はプレイヤーの座標を使用
                const playerX2 = fieldData.x2 > 0 ? fieldData.x2 : playerX;
                const playerY2 = fieldData.y2 > 0 ? fieldData.y2 : playerY;

                const player2: Player = new Player(this.gameScene, playerX2, playerY2, 'lamy', this.tileMap.getMakeTilemap())
                player2.state = CharacterState.normal;
                player2.setData('name', searchCharacterData.getCharacterData(player2.name).name)

                //各種設定
                player2.setDataEnabled();
                player2.setData(this.gameScene.cache.json.get('savedata').playerData2.status);
                player2.setData(this.gameScene.cache.json.get('savedata').playerData2.Equip);
                player2.setData(this.gameScene.cache.json.get('savedata').playerData2.Skill);
                player2.setDepth(MapLayerDepth.High + player2.y);

                //プレイヤーと衝突判定の設定
                if (this.tileMap.getCollisionLayer()) {
                    this.gameScene.physics.add.collider(player2, this.tileMap.getCollisionLayer());
                }

                this.playerPartyList.push(player2);
            }

            //プレイヤー3作成
            if (this.gameScene.cache.json.get('savedata').playerData3.PartyMemberFlg) {

                const player3: Player = new Player(this.gameScene, playerX, playerY, 'lamy', this.tileMap.getMakeTilemap())
                player3.state = CharacterState.normal;
                player3.setData('name', searchCharacterData.getCharacterData(player3.name).name)

                //各種設定
                player3.setDataEnabled();
                player3.setData(this.gameScene.cache.json.get('savedata').playerData3.status);
                player3.setData(this.gameScene.cache.json.get('savedata').playerData3.Equip);
                player3.setData(this.gameScene.cache.json.get('savedata').playerData3.Skill);
                player3.setDepth(MapLayerDepth.High + player3.y);

                this.playerPartyList.push(player3);
            }

            // 状態管理クラスのパーティリストを更新
            gameStateManager.setPlayerPartyList(this.playerPartyList);

            this.gameScene.events.on('shutdown', () => {
                for (const player of this.playerPartyList) {
                    player.destroy();
                }
            });

            resolve();
        });

    }
}