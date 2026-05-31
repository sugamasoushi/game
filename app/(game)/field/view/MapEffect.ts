import { FieldScene } from "../../lib/SceneTypes";
import { TileMap } from "./TileMap";

import { Light2D } from "./effefct/Light2D";
import { FogShader } from "./effefct/FogShader";
import { BgRenderTexture } from "./effefct/BgRenderTexture";
import { WaterReflectionShader } from './effefct/WaterReflectionShader';

export class MapEffect {
    private lightFlg = false;
    private light2DInstance: Light2D;

    private fogFlg = false;
    private fogShaderInstance: FogShader;

    private bgRenderTextureFlg = false;
    private bgRenderTextureInstance: BgRenderTexture;

    private waterReflectionShaderFlg = false;
    private waterReflectionShaderInstance: WaterReflectionShader;

    constructor(private fieldScene: FieldScene, private tileMap: TileMap) {
        this.setLightInfomation();

        if (this.lightFlg) this.light2DInstance = new Light2D(this.fieldScene);
        if (this.fogFlg) this.fogShaderInstance = new FogShader(this.fieldScene, this.tileMap);
        if (this.bgRenderTextureFlg) this.bgRenderTextureInstance = new BgRenderTexture(this.fieldScene, this.tileMap);
        if (this.waterReflectionShaderFlg) this.waterReflectionShaderInstance = new WaterReflectionShader(this.fieldScene, this.tileMap);
    }

    public async execute() {

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

    //エフェクト情報を設定
    private setLightInfomation() {

        const makeTileMap: Phaser.Tilemaps.Tilemap = this.tileMap.getMakeTilemap();
        if (makeTileMap.getObjectLayer('LIGHT')) { this.lightFlg = true; }
        if (makeTileMap.getObjectLayer('WATER_SURFACE')) {
            this.bgRenderTextureFlg = true;
            this.waterReflectionShaderFlg = true;
        }

        //タイルマップのプロパティからeffect情報を設定
        if (Array.isArray(makeTileMap.properties)) {
            for (const prop of makeTileMap.properties) {
                if (prop.name === 'fog') { this.fogFlg = true; }
                if (prop.name === 'fog_front') { this.fogFlg = true; }
            }
        }
    }
}