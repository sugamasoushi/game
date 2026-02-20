import { GameScene } from "../../lib/types";
import { FieldData } from "../../lib/types";

interface AnimationTileMapLayer extends Phaser.Tilemaps.TilemapLayer {
    useAnimTile: number[];
}

/**
 * タイルマップ管理クラス
 * 
 * ■各名称
 * タイルマップ：phaserによりtiledデータから作成されるデータ。タイルセットやレイヤー情報が格納される。
 * タイルマップレイヤー：画面に描画するレイヤー情報
 * タイルセット：実際に描画される画像データ。32*32で1タイルと定義され、gidというidで管理される。0番目は左上、2番目が右隣のタイルとなる。 
 * 
 * ■タイルマップレイヤーの命名ルール（仮）
 * PO（Player Over）描画物がプレイヤーを覆う
 * PU（Player Under）描画物がプレイヤーの下に存在
 * PW（Player With）描画物とプレイヤーが同じくらいの高さ、位置関係にある
 * 
 * ■注意
 * 一つのタイルマップレイヤーに使用するタイルセットは一つのみ。tiledでは特に制限が無いが、当ゲームの処理では未対応。
 * 
 * @export
 * @class Map
 */
export class TileMap extends Phaser.GameObjects.Container {
    private fieldData: FieldData;

    private gameScene: GameScene;
    private animationTileMapLayer: Array<AnimationTileMapLayer> = [];
    private makeTilemap: Phaser.Tilemaps.Tilemap;
    private collisionLayer: Phaser.Tilemaps.TilemapLayer;
    private playerWithDepthMapName: Array<string> = [];

    constructor(scene: GameScene) {
        super(scene);
        this.gameScene = scene;
        this.addToUpdateList();
    }

    public execute(fieldData: FieldData) {
        this.fieldData = fieldData;

        //マップ作成　※非同期処理は無
        this.createTileMap();
        //this.gameScene.events.emit('READY_TILEMAP');

    }

    preUpdate(time: number) { this.tileAnimation(time) }

    /**
     * タイルマップ作成
     * 
     * ■処理概要
     * ツール「Tiled」で作成したjson及びタイルマップ画像を使用して画面にマップを描画する。
     *  
     * ■備忘
     * タイルマップのidチェックやアニメーションタイルに使用するタイルのチェックを行っている。
     * 処理内容が多いため後で別メソッド化すべき。
     */
    private createTileMap() {
        const mapkey = this.fieldData.mapKey;
        //console.log(mapkey)

        //mapkeyからTiledデータを呼び出す
        const tilemap: Phaser.Tilemaps.Tilemap = this.gameScene.make.tilemap({ key: mapkey });
        this.makeTilemap = tilemap;

        //JSONから読み込んだTiledデータにはレイヤー、タイルセットのキー情報、オブジェクト情報、タイルアニメーション情報が含まれている
        // console.log(tilemap);

        //Tiledデータにタイルセットの画像情報を設定
        //例：this.tilemap.addTilesetImage('base_out_atlas', 'base_out_atlas');省略しない場合はこの書き方、キー情報を紐づけている。
        tilemap.tilesets.forEach(tilesetArray => {
            tilemap.addTilesetImage(tilesetArray.name);
        })

        //初期化
        this.animationTileMapLayer.splice(0);

        //タイルレイヤーを作成する。
        for (let i = 0; i < tilemap.layers.length; i++) {

            //タイルマップレイヤーの配列に格納されているgidを全て抽出し、最大値と最小値の範囲を求める。
            //レイヤー内のgidの最大値を抽出
            let maxGid: number = 0;
            tilemap.layers[i].data.forEach(array1 => array1.forEach(array2 => {
                //レイヤーは2次元配列となっている 「tilemap.layers[0].data[0][0].index」
                if (maxGid < array2.index) {
                    maxGid = array2.index;
                }
            }))

            //レイヤー内のgidの最小値を抽出
            let minGid: number = maxGid;
            tilemap.layers[i].data.forEach(array1 => array1.forEach(array2 => {
                //存在しないタイルはJSONから取り込んだ際に0 → -1に変換されているため無視する
                if (minGid > array2.index && !(array2.index === -1)) {
                    minGid = array2.index;
                }
            }))

            //console.log("layers[" + i + "] = " + scene.tilemap.layers[i].name + "、minGid = " + minGid + "、maxGid = " + maxGid);

            //Tiledデータチェック
            //全てのタイルセットのgid範囲をチェックし、レイヤーが保持するgidがいずれかタイルセットのgid範囲に収まっていれば問題無しとする。
            //上記以外の場合は複数のタイルセット使用していると判定し、要注意データとする
            let check: boolean = false;
            tilemap.tilesets.forEach(tilesetArray => {
                const lastgid: number = tilesetArray.firstgid + tilesetArray.total - 1;
                //console.log("firstgid = " + obj.firstgid + "、lastgid = " + lastgid);
                if (tilesetArray.firstgid <= minGid && lastgid >= maxGid) {
                    check = true;
                }
            });

            //レイヤーのgidチェック結果がfalseの場合、要注意データとしてアラートを出力する
            if (!check) {
                alert("レイヤー名：" + tilemap.layers[i].name + "\nこのレイヤーではタイルセットを複数使用しているため、描画破損の可能性があります。\nまたはタイルセットが存在しません。")
            }

            //使用するタイルセットを検索
            let tilesetName!: string;
            tilemap.tilesets.forEach(tilesetArray => {
                //使用するタイルセットのfirstgidがmaxGidの範囲内に収まれば使用するタイルセット名となる。
                //maxGidが大きすぎる場合は意図しないタイルセットを参照する事となるが、前段のチェックで回避する事。
                //console.log("firstgid = " + obj.firstgid + " ,maxGid = " + maxGid);
                if (tilesetArray.firstgid <= maxGid) {
                    tilesetName = tilesetArray.name;
                }
            })
            //console.log("使用するタイルセット = " + tilesetName);

            //レイヤーで使用するタイルセットをレイヤーに設定し描画する。
            if (tilesetName === 'collision') {
                //レイヤーがcollisionの場合、衝突判定及び非表示を設定。
                this.collisionLayer = (tilemap.createLayer(tilemap.layers[i].name, tilesetName)) as Phaser.Tilemaps.TilemapLayer;//asはアサーションと言い、明示的にnullかundefineの場合にassertする。
                //const collisionLayer = tilemap.createLayer(tilemap.layers[i].name, tilesetName)!;//別の書き方、非nullアサーション演算子という。
                tilemap.layers[i].tilemapLayer.setDepth(tilemap.layers[i].heightInPixels);
                //mapの当たり判定
                this.collisionLayer.setCollisionByExclusion([-1], true);
                //scene.collisionLayer.removeFromDisplayList();
                this.collisionLayer.setVisible(false);//非表示にするだけならこちらを使用する

            } else {
                //描画のみ
                tilemap.createLayer(tilemap.layers[i].name, tilesetName);
                tilemap.layers[i].tilemapLayer.setDepth(i);
            }

            //高さを設定（PO=Player Over）
            if (tilemap.layers[i].name.substring(0, 2) === 'PO') {
                //console.log(scene.tilemap.layers[i].heightInPixels);
                tilemap.layers[i].tilemapLayer.setDepth(tilemap.layers[i].heightInPixels);
            }

            //プレイヤーと同じ高さに設定するマップオブジェクトへの参照を格納
            if (tilemap.layers[i].name.substring(0, 2) === 'PW') {
                this.playerWithDepthMapName.push(tilemap.layers[i].name);
                // console.log(this.playerWithDepthMapName);
                //scene.tilemap.layers[i].tilemapLayer.setDepth(scene.player.y + (32 / 2) * 0.8 - 1);//初期値、プレイヤーの高さ-1
            }

            //背景画像のスクロールを遅らせるよう設定
            if (tilemap.layers[i].name === 'background') {
                tilemap.layers[i].tilemapLayer.setScrollFactor(0.5)
            }
            // console.log("getIndexList = " + scene.tilemap.layers[i].tilemapLayer.getIndexList());
        }

        /*
        * アニメーションタイルを含むレイヤーへの参照を格納する
        */
        const layers: Phaser.Tilemaps.LayerData[] = tilemap.layers;
        //console.log(layers);
        // for (const [index, layer] of layers.entries()) {//index付き
        //     // console.log(index, layer);
        //     console.log(layer.tilemapLayer);
        // }

        for (const layer of layers) {
            // console.log(layer.tilemapLayer);
            const tilemapLayer: Phaser.Tilemaps.TilemapLayer = layer.tilemapLayer;
            let animationCheck: boolean = false;
            const useTileArray: Array<number> = [];

            if (tilemapLayer.type === "TilemapLayer") {

                //レイヤーで使用するアニメーションタイルをチェックする
                // const tileset[]: Phaser.Tilemaps.Tileset[] = tilemapLayer.tileset;
                const tileset: Array<Phaser.Tilemaps.Tileset> = tilemapLayer.tileset;
                // console.log(tileset);

                for (const tilesetArray of tileset) {

                    // tilesetArray.tileData.animationはオブジェクトの為、オブジェクトの型を定義
                    // Record<K, V>　で型定義。キーと値の関係が分かっている状態で使用可能。
                    type TileAnimationData = {
                        animation?: {
                            tileid: number;
                            duration: number;
                        }[];
                    };
                    // type TileAnimationDataは以下と同じ意味
                    // {
                    //     [key: number]: TileAnimationData;
                    // }

                    // 以下も同じ意味。Recordはinterfaceと違い拡張性は無いが、拡張不要かつその場限りの使用であれば最適。
                    // interface TileDataMap {
                    //     [tileId: number]: TileAnimationData;
                    // }
                    const tileData = tilesetArray.tileData as Record<number, TileAnimationData>;

                    // tileDataが存在する（オブジェクトキー数が0でない）場合
                    if (Object.keys(tileData).length !== 0) {

                        for (const objectKey in tileData) {
                            const data = tileData[objectKey];

                            //アニメーションタイルが存在する場合
                            if (data.animation) {

                                //アニメーションタイルIDの1番目を示す配列番号を算出。この値はタイルマップ画像を32*32単位のタイル画像位置を示す。
                                const animId: number = tilesetArray.firstgid + data.animation[0].tileid;

                                //アニメーションタイルIDと一致するlayer.data.array[][].indexを取得
                                const tilemapsTileData: Phaser.Tilemaps.Tile[][] = tilemapLayer.layer.data;
                                for (const row of tilemapsTileData) {
                                    for (const tile of row) {
                                        if (!tile || tile.index === -1) continue;
                                        if (animId === tile.index) {
                                            animationCheck = true;

                                            //アニメーションタイルのfirstgidを格納
                                            //そのタイルで使用するアニメーションタイルのリストを予め作成しておく
                                            useTileArray.push(data.animation[0].tileid);
                                            //console.log(data.animation[0].tileid)
                                        }
                                    }
                                }

                            }
                        }


                    }
                }
            }

            //アニメーションタイルを含むタイルマップレイヤーを格納
            if (animationCheck) {

                //tilemapLayerにアニメーションタイル情報を格納
                const animationTileMapLayer = tilemapLayer as AnimationTileMapLayer;//型アサーション
                animationTileMapLayer.useAnimTile = Array.from(new Set(useTileArray));//new Set(useTileArray)で重複削除

                //タイルマップレイヤーへの参照を格納
                this.animationTileMapLayer.push(animationTileMapLayer);
            }
        }
        //console.log(this.animationTileMapLayer)
    }

    /**
     * タイルアニメーション
     * 
     * ■処理
     * アニメーション配列に管理用のオブジェクトを追加し、配列毎に更新を行う。
     * 
     * ■コーディング備忘
     * TileMapLayerに紐づくアニメーションタイルプロパティはtileDataに格納されている。
     * このtileDataはタイルマップ画像毎に作成され、使用するTileMapLayer間で共通となるため、使用しないアニメーションタイルまで紐づいてしまう。
     * TileMapLayer毎にアニメーションさせる場合、使用可否が分からないため事前チェックが必要となる。tileMapCriateでチェックを実施し、使用するタイルを別の配列に格納している。
     * ブラウザの処理性能の問題で少し処理落ちしてしまう。
     * 
     * @method tileAnimation
     * @param {*} time - アニメーション間隔
     * @memberof Game
     */
    public tileAnimation(time: number) {
        // 現在シーンのタイルマップにアニメーションが存在する場合
        if (this.animationTileMapLayer.length) {
            const animationTileMapLayer: Array<Phaser.Tilemaps.TilemapLayer> = this.animationTileMapLayer;

            //アニメーション対象のタイルマップレイヤーを処理
            for (const tileMapLayer of animationTileMapLayer) {

                //アニメーションタイルの数だけ処理を行う
                for (const animTileNo of (tileMapLayer as AnimationTileMapLayer).useAnimTile) {//型アサーション
                    const tileset: Array<Phaser.Tilemaps.Tileset> = tileMapLayer.tileset;

                    for (const tilesetObj of tileset) {
                        // tilesetArray.tileData.animationはオブジェクトの為、オブジェクトの型を追加する
                        //元はtileidとdurationのみだが全体の型に管理用の変数を追加
                        type TileAnimationData = {
                            animation?: {
                                tileid: number;//既存
                                duration: number;//既存
                                animationTileIndexCount: number;//拡張
                                nextAnimationTileIndexCount: number;//拡張
                                animationLength: number;//拡張
                                beforeTime: number;//拡張
                                staticTime: number;//拡張
                            }[];
                        };
                        const tileData = tilesetObj.tileData as Record<number, TileAnimationData>;//numberはオブジェクトのキー

                        for (const objectKey in tileData) {//オブジェクトはfor...inで処理

                            //IDチェックとanimationオブジェクトの存在チェック
                            if (animTileNo === Number(objectKey) && tileData[objectKey].animation) {

                                /**
                                 * ■管理用のanimation配列を追加
                                 * 
                                 * tileData[objectKey].animation配列に要素を一つ追加し、管理用オブジェクトを追加する。
                                 * 管理用オブジェクトは最後の配列に存在するため、考慮して処理する事。
                                 */

                                //管理用アニメーションオブジェクトの配列番号。※後続で使用するため、配列追加後に更新している。
                                let animManageIndex: number = tileData[objectKey].animation.length - 1;

                                //初回のみアニメーションカウント管理用のオブジェクトを追加する
                                if (!tileData[objectKey].animation[animManageIndex].animationLength) {
                                    //console.log("初回")
                                    const addIndex = tileData[objectKey].animation.length;
                                    const animTileManage = {
                                        tileid: 0,//未使用だが、typescript的に必要
                                        duration: 0,//未使用だが、typescript的に必要
                                        animationTileIndexCount: 0,
                                        nextAnimationTileIndexCount: 1,
                                        animationLength: addIndex,
                                        beforeTime: time - 100,
                                        staticTime: 0
                                    };

                                    //初期値設定
                                    tileData[objectKey].animation.push(animTileManage);//型アサーション

                                    //配列追加後、管理用の配列番号を更新
                                    animManageIndex = tileData[objectKey].animation.length - 1;
                                }

                                //現在のアニメーションタイルを取得
                                const nowAnim = tileData[objectKey].animation[animManageIndex].animationTileIndexCount;
                                //const nowAnim: number = tileMapLayer.getData("animTileManage").animationTileIndexCount;
                                let animFlag: boolean = false;

                                //アニメーション待機時間の算出と設定
                                const lag: number = time - tileData[objectKey].animation[animManageIndex].beforeTime;
                                tileData[objectKey].animation[animManageIndex].staticTime += lag;

                                //アニメーション判定
                                if (tileData[objectKey].animation[animManageIndex].staticTime > tileData[objectKey].animation[nowAnim].duration) {
                                    animFlag = true;
                                    tileData[objectKey].animation[animManageIndex].staticTime = 0;
                                } else {
                                    animFlag = false;
                                }

                                //判定後、次フレームの計算のためtimeを保存
                                tileData[objectKey].animation[animManageIndex].beforeTime = time;

                                //待機時間ではない場合、アニメーションを実行
                                if (animFlag) {

                                    //現在のタイル番号と更新先のタイル番号を設定、基本的に animationTileIndexCount + 1 = nextAnimationTileIndexCount となる。
                                    const animationTileIndexCount: number = tileData[objectKey].animation[animManageIndex].animationTileIndexCount;
                                    const nextAnimationTileIndexCount: number = tileData[objectKey].animation[animManageIndex].nextAnimationTileIndexCount;

                                    // console.log("現タイルNo", firstgid + tileData[objectKey].animation[animationTileIndexCount].tileid)
                                    // console.log("次タイルNo", firstgid + tileData[objectKey].animation[nextAnimationTileIndexCount].tileid)

                                    // タイル番号の更新によりアニメーションを実現
                                    tileMapLayer.replaceByIndex(
                                        tilesetObj.firstgid + tileData[objectKey].animation[animationTileIndexCount].tileid,
                                        tilesetObj.firstgid + tileData[objectKey].animation[nextAnimationTileIndexCount].tileid
                                        , 0, 0, 100, 100// 0,0,100,100はタイルセット画像に関する値だが、取り合えず無視
                                    );

                                    //アニメーション用カウント更新。タイル更新後、アニメーション配列番号を１進めて次に更新するタイル番号の設定値とする。
                                    //更新先のアニメーション配列番号が、配列の最後だった場合、カウントを0に設定。そうでない場合は次のアニメーション配列番号を設定。
                                    if ((animationTileIndexCount + 1) === tileData[objectKey].animation.length - 1) {
                                        tileData[objectKey].animation[animManageIndex].animationTileIndexCount = 0;
                                        //console.log(tileData[objectKey].animation[animManageIndex].animationTileIndexCount)
                                    } else {
                                        tileData[objectKey].animation[animManageIndex].animationTileIndexCount++;
                                        //console.log(tileData[objectKey].animation[animManageIndex].animationTileIndexCount)
                                    }

                                    if ((nextAnimationTileIndexCount + 1) === tileData[objectKey].animation.length - 1) {
                                        tileData[objectKey].animation[animManageIndex].nextAnimationTileIndexCount = 0;
                                        //console.log(tileData[objectKey].animation[animManageIndex].nextAnimationTileIndexCount)
                                    } else {
                                        tileData[objectKey].animation[animManageIndex].nextAnimationTileIndexCount = tileData[objectKey].animation[animManageIndex].animationTileIndexCount + 1;
                                        //console.log(tileData[objectKey].animation[animManageIndex].nextAnimationTileIndexCount)
                                    }
                                    //alert("停止")
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    public getPlayerWithDepthMapName(): Array<string> { return this.playerWithDepthMapName; }
    public getMakeTilemap(): Phaser.Tilemaps.Tilemap { return this.makeTilemap; }
    public getCollisionLayer(): Phaser.Tilemaps.TilemapLayer { return this.collisionLayer };

    public getTilemapInPixels(): { widthInPixels: number, heightInPixels: number } {
        const widthInPixels: number = this.makeTilemap.widthInPixels;
        const heightInPixels: number = this.makeTilemap.heightInPixels;

        return { widthInPixels, heightInPixels };
    }

}