import { FieldScene } from "../../lib/SceneTypes";
import { TileMap } from "./TileMap";
import { MapShadow } from "./MapEffefct/MapShadow";
import { Light2D } from "./MapEffefct/Light2D";
import { FogShader } from "./MapEffefct/FogShader";
import { BgRenderTexture } from "./MapEffefct/BgRenderTexture";
import { WaterReflectionShader } from './MapEffefct/WaterReflectionShader';
import { TiledMapPropatiesEntity } from "./Entity/TiledMapPropatiesEntity";

export class MapEffect {
    private mapShadowFlg = false;
    private MapShadowInstance: MapShadow;

    private lightFlg = false;
    private light2DInstance: Light2D;

    private fogFlg = false;
    private fogShaderInstance: FogShader;

    private bgRenderTextureFlg = false;
    private bgRenderTextureInstance: BgRenderTexture;

    private waterReflectionShaderFlg = false;
    private waterReflectionShaderInstance: WaterReflectionShader;

    constructor(private fieldScene: FieldScene, private tileMap: TileMap, private tiledMapPropatiesEntity: TiledMapPropatiesEntity) {
        this.setLightInfomation();

        //if (this.mapShadowFlg) this.MapShadowInstance = new MapShadow(fieldScene, tileMap);
        if (this.lightFlg) this.light2DInstance = new Light2D(this.fieldScene);
        if (this.fogFlg) this.fogShaderInstance = new FogShader(this.fieldScene, this.tileMap);
        if (this.bgRenderTextureFlg) this.bgRenderTextureInstance = new BgRenderTexture(this.fieldScene, this.tileMap);
        if (this.waterReflectionShaderFlg) this.waterReflectionShaderInstance = new WaterReflectionShader(this.fieldScene, this.tileMap);
    }

    //タイルマップのプロパティからeffect情報を設定
    private setLightInfomation() {

        //if (this.tileMap.getMapHighestLayerList()) { this.mapShadowFlg = true }

        const makeTileMap: Phaser.Tilemaps.Tilemap = this.tileMap.getMakeTilemap();
        if (makeTileMap.getObjectLayer('LIGHT') || this.tiledMapPropatiesEntity.ambientColor) { this.lightFlg = true; }
        if (makeTileMap.getObjectLayer('WATER_SURFACE')) {
            this.bgRenderTextureFlg = true;
            this.waterReflectionShaderFlg = true;
        }

        if (this.tileMap.getTileMapPropatiesEntity().fog !== '') { this.fogFlg = true; }
        if (this.tileMap.getTileMapPropatiesEntity().fog_front !== '') { this.fogFlg = true; }
    }

    public async execute() {

        //影を作成
        //if (this.mapShadowFlg) { await this.MapShadowInstance.execute(); }

        //背景のテクスチャ　※水面反射等とセットで使用する事
        if (this.bgRenderTextureFlg) await this.bgRenderTextureInstance.execute();

        //水面反射シェーダ
        if (this.waterReflectionShaderFlg) await this.waterReflectionShaderInstance.execute();

        //霧
        if (this.fogFlg) await this.fogShaderInstance.execute();

        //light　※レンダーテクスチャ生成の後に作成しないとテクスチャが生成されない
        if (this.lightFlg) await this.light2DInstance.execute(this.tileMap);
    }

    public update(time: number, delta: number) {
        if (this.bgRenderTextureFlg) this.bgRenderTextureInstance.update(time, delta);
        if (this.lightFlg) this.light2DInstance.update(time, delta);
    }

}