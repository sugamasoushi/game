import { PropertyItem } from "@/app/(game)/lib/FieldTypes";

/**
 * データの取得と加工（パス置換など）を管理するラッパークラス
 */
export class TiledMapLayerPropatiesEntity {
    private readonly dataMap: Map<string, string | number | boolean | null | undefined>;

    constructor(rawData?: PropertyItem[]) {
        // Phaser の tilemap.properties は配列またはオブジェクトのどちらかで提供される場合があるため両方に対応
        if (Array.isArray(rawData)) {
            // [{ name, type, value }, ...] の形式
            this.dataMap = new Map(rawData.map((item) => [item.name, item.value]));
        } else if (rawData && typeof rawData === 'object') {
            // { key: value, ... } の形式やその他オブジェクト形式
            try {
                this.dataMap = new Map(Object.entries(rawData));
            } catch {
                this.dataMap = new Map();
            }
        } else {
            this.dataMap = new Map();
        }
    }

    get WaterSurface(): boolean {
        const value = this.dataMap.get("WaterSurface");
        return typeof value === "boolean" ? value : false;
    }

    get frontFog(): boolean {
        const value = this.dataMap.get("frontFog");
        return typeof value === "boolean" ? value : false;
    }

    get scroll(): boolean {
        const value = this.dataMap.get("scroll");
        return typeof value === "boolean" ? value : false;
    }

    get scrollX(): number | undefined {
        const value = this.dataMap.get("scrollX");
        return typeof value === "number" ? value : undefined;
    }

    get scrollY(): number | undefined {
        const value = this.dataMap.get("scrollY");
        return typeof value === "number" ? value : undefined;
    }
}