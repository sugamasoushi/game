import { PropertyItem } from "@/app/(game)/lib/FieldTypes";

/**
 * データの取得と加工（パス置換など）を管理するラッパークラス
 */
export class TiledMapPropatiesEntity {
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

    get CameraEffect(): string {
        const value = this.dataMap.get("CameraEffect");
        if (typeof value !== "string") return "";
        return value;
    }

    get battleFieldKey(): string {
        const value = this.dataMap.get("battleFieldKey");
        if (typeof value !== "string") return "";
        return value;
    }

    get ambientColor(): string {
        const value = this.dataMap.get("ambientColor");
        if (typeof value !== "string") return "";
        return value;
    }

    get fog(): string {
        const value = this.dataMap.get("fog");
        if (typeof value !== "string") return "";
        return value;
    }

    get fog_front(): string {
        const value = this.dataMap.get("fog_front");
        if (typeof value !== "string") return "";
        return value;
    }
}