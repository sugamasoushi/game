/**
 * phaserのインスタンス作成の後に画面描画が始まるが、socket.io等の自作メソッドは画面描画と同時に実行されない模様。
 * LoadSceneを挟むことで全シーンのインスタンス作成後の画面遷移で自作メソッドが実行される。これはjavascriptそのものやphaserやsocket.ioの実行順序の問題だと思う
 */
import { Scene } from 'phaser';
import { tilesets, State } from '../lib/types';
import { GameStateManager } from '../GameAllState/GameStateManager';

export class Load extends Scene {
    private gameWidth: number;
    private gameHeight: number;
    private progress!: Phaser.GameObjects.Graphics;//! 明確な割り当てアサーション演算子。クラスのプロパティが型アノテーションで示された型でセットされていることをコンパイラーに伝える記号。

    constructor() {
        // Sceneを拡張してクラスを作る際にコンストラクタでSceneの設定を渡します
        super('Load');
    }

    // create()はpreload内のアセットのロードが完了したら実行される
    preload() {
        this.gameWidth = Number(this.game.config.width)
        this.gameHeight = Number(this.game.config.height)

        this.progress = this.add.graphics();

        //プログレスバー
        //読み込みが完了するたびに更新されるvalueを使って表現する
        this.load.on('progress', (value: number) => {
            this.progress.clear();
            this.progress.fillStyle(0xffffff, 1);
            this.progress.fillRect(this.gameWidth / 10, this.gameHeight / 2, this.gameWidth * 8 / 10 * value, 30);
        });

        this.load.on('complete', () => {
            this.progress.destroy();
        });

        this.load.text('testtext', 'assets/talktext/testtext.txt');
        this.load.text('Character_text', 'assets/talktext/Character.txt');
        this.load.image('enemy00', 'assets/img/CharaStand/enemy00.png');
        this.load.image('enemy01', 'assets/img/CharaStand/enemy01.png');
        this.load.image('enemy02', 'assets/img/CharaStand/enemy02.png');
        this.load.image('20230905', 'assets/img/CharaStand/20230905.png');
        this.load.image('20230427', 'assets/img/CharaStand/20230427.png');
        this.load.image('20230927', 'assets/img/CharaStand/20230927.png');
        this.load.image('20250609', 'assets/img/CharaStand/20250609.png');
        this.load.image('20240622_鶏', 'assets/img/CharaStand/20240622_鶏.png');
        this.load.image('20240908', 'assets/img/CharaStand/20240908.png');
        this.load.image('20240907_3', 'assets/img/CharaStand/20240907_3.png');
        this.load.image('Icon_20230905', 'assets/img/charIcon/Icon_20230905.png');
        this.load.image('Icon_20240622_鶏', 'assets/img/charIcon/Icon_20240622_鶏.png');
        this.load.image('Icon_20230427', 'assets/img/charIcon/Icon_20230427.png');
        this.load.image('Icon_20240908', 'assets/img/charIcon/Icon_20240908.png');
        this.load.image('Icon_20250609', 'assets/img/charIcon/Icon_20250609.png');
        this.load.image('Icon_ossan', 'assets/img/charIcon/Icon_ossan.png');
        this.load.image('hill_ComfyUI', 'assets/img/background/ComfyUI_temp_izzuc_00031_.png');
        this.load.image('20250603', 'assets/img/eventpicture/20250603.jpg');
        this.load.spritesheet('girl', 'assets/img/spritesheet/char_45_75.png',
            { frameWidth: 45, frameHeight: 75 }
        );
        this.load.spritesheet('amber', 'assets/img/spritesheet/amber.png',
            { frameWidth: 28, frameHeight: 39 }
        );
        this.load.spritesheet('meina', 'assets/img/spritesheet/meina2_32_40.png',
            { frameWidth: 32, frameHeight: 40 }
        );

        this.load.spritesheet('lamy', 'assets/img/spritesheet/lamy_32_40.png',
            { frameWidth: 32, frameHeight: 40 }
        );

        this.load.spritesheet('mob01', 'assets/img/spritesheet/pipo-charachip030.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet('mob02', 'assets/img/spritesheet/pipo-charachip029.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet('whiteCat', 'assets/img/spritesheet/whiteCat.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet('blackCat', 'assets/img/spritesheet/blackCat.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet('slime', 'assets/img/spritesheet/slime.png',
            { frameWidth: 32, frameHeight: 32 }
        );

        this.load.spritesheet('waterfall', 'assets/img/tilesets/waterfall.png',
            { frameWidth: 160, frameHeight: 192 }
        );


        this.load.spritesheet({
            key: 'boy',
            url: "/assets/img/spritesheet/boy.png",
            frameConfig: {
                frameWidth: 21,  //The width of the frame in pixels.
                frameHeight: 26, //The height of the frame in pixels. Uses the frameWidth value if not provided.
                startFrame: 0,   //The first frame to start parsing from.
                endFrame: 12,    //The frame to stop parsing at. If not provided it will calculate the value based on the image and frame dimensions.
                margin: 0,       //The margin in the image. This is the space around the edge of the frames.
                spacing: 0
            }      //The spacing between each frame in the image.
        });

        this.load.spritesheet({
            key: 'chicken_walk',
            url: "/assets/img/spritesheet/chicken_walk.png",
            frameConfig: {
                frameWidth: 32,  //横幅
                frameHeight: 32, //縦幅　指定が無い場合は横幅の値が使用される
                startFrame: 0,   //解析の最初のフレーム
                endFrame: 15,    //最後のフレーム　指定無しの場合はフレーム幅で分割計算される
                margin: 0,       //余白　フレームの端のスペース
                spacing: 0
            }      //各フレームの間隔。
        });

        this.load.spritesheet({
            key: 'chicken_shadow',
            url: "/assets/img/spritesheet/chicken_shadow.png",
            frameConfig: {
                frameWidth: 32,  //横幅
                frameHeight: 32, //縦幅　指定が無い場合は横幅の値が使用される
                startFrame: 0,   //解析の最初のフレーム
                endFrame: 3,    //最後のフレーム　指定無しの場合はフレーム幅で分割計算される
                margin: 0,       //余白　フレームの端のスペース
                spacing: 0 //各フレームの間隔。
            }
        });

        this.load.spritesheet({
            key: 'bubble',
            url: "/assets/img/spritesheet/bubble.png",
            frameConfig: {
                frameWidth: 32,  //横幅
                frameHeight: 32, //縦幅　指定が無い場合は横幅の値が使用される
                startFrame: 0,   //解析の最初のフレーム
                endFrame: 2,    //最後のフレーム　指定無しの場合はフレーム幅で分割計算される
                margin: 0,       //余白　フレームの端のスペース
                spacing: 0 //各フレームの間隔。
            }
        });

        this.load.spritesheet({
            key: 'flames32',
            url: "/assets/img/spritesheet/flames32.png",
            frameConfig: {
                frameWidth: 32,  //横幅
                frameHeight: 48, //縦幅　指定が無い場合は横幅の値が使用される
                startFrame: 0,   //解析の最初のフレーム
                endFrame: 11,    //最後のフレーム　指定無しの場合はフレーム幅で分割計算される
                margin: 0,       //余白　フレームの端のスペース
                spacing: 0 //各フレームの間隔。
            }
        });

        this.load.audio('bgm_otobokeDance', 'assets/sound/おとぼけダンス(Silly_dance).mp3');
        //https://dova-s.jp/bgm/play17179.html

        this.load.audio('bgm_aruges', 'assets/sound/悪魔軍特攻隊長～電影のアルゲス～.mp3');
        //https://dova-s.jp/bgm/play18480.html

        this.load.audio('SE_waterFall', 'assets/sound/滝1.mp3');
        this.load.audio('SE_doukutu', 'assets/sound/薄青い洞窟.mp3');
        this.load.audio('SE_fire', 'assets/sound/火炎魔法1.mp3');
        this.load.audio('SE_punch', 'assets/sound/重いパンチ1.mp3');
        this.load.audio('SE_karuipunch', 'assets/sound/軽いパンチ1.mp3');
        this.load.audio('SE_attack', 'assets/sound/打撃3.mp3');
        this.load.audio('SE_victory', 'assets/sound/回復魔法4.mp3');
        this.load.audio('SE_message', 'assets/sound/メッセージ表示音3.mp3');
        //https://soundeffect-lab.info/sound/battle/

        //タイル画像のロード
        //データ内のタイルセット画像のURLの一部を書き換える。配置を変更する場合は注意。
        this.cache.tilemap.getKeys().forEach(key => {
            // console.log(this.cache.tilemap.get(key).data.tilesets)
            const tilesets: tilesets[] = this.cache.tilemap.get(key).data.tilesets;
            tilesets.forEach(obj => {
                const tileKey = obj.name;
                const tileUrl = obj.image.replace('..', 'assets');
                this.load.image({ key: tileKey, url: tileUrl });
            })
        })

        //イベント管理マップをセーブデータから取得
        // const falgObj = this.cache.json.get('savedata').EventFlag;
        // Object.keys(falgObj).forEach(index => {
        //     this.eventStatusFlagMap.set(index, falgObj[index])
        // })

    }

    create(data: { sceneKey: string }) {

        //状態管理クラス
        const manager = GameStateManager.getInstance();

        // アセットのロード完了後、次のシーンに遷移
        this.load.on('complete', () => {

            //サウンドシーンを並行して実行
            this.scene.launch('Sound');

            //状態更新
            manager.updateState({ state: State.FIELD }, data.sceneKey)
        });

        // アセットのロードを開始（preload外でロードを行う場合はこのメソッドを呼ぶ必要がある）
        //多分今時点で使われてない
        this.load.start();

        this.scene.stop();
    }
}
