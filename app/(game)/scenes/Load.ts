/**
 * phaserのインスタンス作成の後に画面描画が始まるが、socket.io等の自作メソッドは画面描画と同時に実行されない模様。
 * LoadSceneを挟むことで全シーンのインスタンス作成後の画面遷移で自作メソッドが実行される。これはjavascriptそのものやphaserやsocket.ioの実行順序の問題だと思う
 */
import { Scene } from 'phaser';
import { State } from '../lib/StateTypes';
import { GameStateManager } from '../core/GameStateManager';

export class Load extends Scene {
    private gameWidth: number;
    private gameHeight: number;
    private progress!: Phaser.GameObjects.Graphics;//! 明確な割り当てアサーション演算子。クラスのプロパティが型アノテーションで示された型でセットされていることをコンパイラーに伝える記号。

    private newGameFlg: boolean = false;

    constructor() {
        // Sceneを拡張してクラスを作る際にコンストラクタでSceneの設定を渡します
        super('Load');
    }

    init(data: { sceneKey: string }) {
        this.newGameFlg = data.sceneKey === 'New Game';
    }

    // create()はpreload内のアセットのロードが完了したら実行される
    preload() {
        this.gameWidth = Number(this.game.config.width)
        this.gameHeight = Number(this.game.config.height)

        this.progress = this.add.graphics();

        if (this.newGameFlg) {
            if (this.cache.json.exists('savedata')) {
                this.cache.json.remove('savedata');
            }
            this.load.json('savedata', 'assets/data/savedata.json');
        }

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

        this.load.json('bubbleTalkData', 'assets/data/bubbleTalkData.json');
        this.load.json('enemydata', 'assets/data/enemydata.json');
        this.load.json('skilldata', 'assets/data/skilldata.json');
        this.load.json('characterdata', 'assets/data/characterdata.json');
        this.load.json('itemdata', 'assets/data/itemdata.json');
        this.load.json('tilemapdata', 'assets/data/tilemapdata.json');
        this.load.json('battlefieldData', 'assets/data/battlefieldData.json');

        this.load.image('enemy00', 'assets/img/CharaStand/enemy00.png');
        this.load.image('enemy01', 'assets/img/CharaStand/enemy01.png');
        this.load.image('enemy02', 'assets/img/CharaStand/enemy02.png');
        this.load.image('enemy03', ['assets/img/CharaStand/enemy03.png', 'assets/img/CharaStand/enemy03_n.png']);

        this.load.image('20230905', 'assets/img/CharaStand/20230905.png');
        this.load.image('20230427', 'assets/img/CharaStand/20230427.png');
        this.load.image('20230927', 'assets/img/CharaStand/20230927.png');
        this.load.image('20250609', 'assets/img/CharaStand/20250609.png');
        this.load.image('20240713_2', 'assets/img/CharaStand/20240713_2.png');
        this.load.image('20240622_鶏', 'assets/img/CharaStand/20240622_鶏.png');
        this.load.image('20240908', 'assets/img/CharaStand/20240908.png');
        this.load.image('20240907_3', 'assets/img/CharaStand/20240907_3.png');
        this.load.image('Icon_20230905', 'assets/img/charIcon/Icon_20230905.png');
        this.load.image('Icon_20240622_鶏', 'assets/img/charIcon/Icon_20240622_鶏.png');
        this.load.image('Icon_20230427', 'assets/img/charIcon/Icon_20230427.png');
        this.load.image('Icon_20240908', 'assets/img/charIcon/Icon_20240908.png');
        this.load.image('Icon_20250609', 'assets/img/charIcon/Icon_20250609.png');
        this.load.image('Icon_ossan', 'assets/img/charIcon/Icon_ossan.png');
        this.load.image('20250603', 'assets/img/eventpicture/20250603.jpg');

        this.load.image('battle_hill', 'assets/img/background/ComfyUI_temp_izzuc_00031_.png');
        this.load.image('battle_hill_01', 'assets/img/background/battle_hill_01.png');
        this.load.image('battle_hill_02', 'assets/img/background/battle_hill_02.png');
        this.load.image('battle_hill_03', 'assets/img/background/battle_hill_03.png');
        this.load.image('battle_forest', 'assets/img/background/battle_forest.png');
        this.load.image('battle_cave', ['assets/img/background/ComfyUI_temp_xpgcm_00020_.png', 'assets/img/background/ComfyUI_temp_xpgcm_00020__n.png']);

        this.load.image('menu_meina', 'assets/img/CharaStand/menu_meina.png');
        this.load.image('menu_lamy', 'assets/img/CharaStand/menu_lamy.png');

        this.load.atlas('flares', 'assets/img/effect/flares.png', 'assets/img/effect/flares.json');

        this.load.glsl('fireball', 'assets/img/effect/shader/shader0.frag');
        this.load.glsl('cloud', 'assets/img/effect/shader/cloud.frag');
        this.load.glsl('blueSky', 'assets/img/effect/shader/bulesky.frag');
        this.load.glsl('nightsky', 'assets/img/effect/shader/nightsky.frag');
        this.load.glsl('circleMask', 'assets/img/effect/shader/circlemask.frag');
        this.load.glsl('fog', 'assets/img/effect/shader/fog.frag');

        this.load.glsl('watershader', 'assets/img/effect/shader/water.frag');


        this.load.image('noise', 'assets/img/effect/noise/Super Noise/Super Noise 14 - 512x512.png');
        this.load.image('noise2', 'assets/img/effect/noise/Super Perlin/Super Perlin 12 - 512x512.png');

        this.load.spritesheet('girl', 'assets/img/spritesheet/char_45_75.png',
            { frameWidth: 45, frameHeight: 75 }
        );
        this.load.spritesheet('tex_meina', 'assets/img/spritesheet/meina2_32_40.png',
            { frameWidth: 32, frameHeight: 40 }
        );
        this.load.spritesheet('tex_lamy', 'assets/img/spritesheet/lamy_32_40.png',
            { frameWidth: 32, frameHeight: 40 }
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

        // this.load.spritesheet({
        //     key: 'chicken_walk',
        //     url: "/assets/img/spritesheet/chicken_walk.png",
        //     frameConfig: {
        //         frameWidth: 32,  //横幅
        //         frameHeight: 32, //縦幅　指定が無い場合は横幅の値が使用される
        //         startFrame: 0,   //解析の最初のフレーム
        //         endFrame: 15,    //最後のフレーム　指定無しの場合はフレーム幅で分割計算される
        //         margin: 0,       //余白　フレームの端のスペース
        //         spacing: 0
        //     }      //各フレームの間隔。
        // });

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
            key: 'normalAttack',
            url: "/assets/img/spritesheet/pipo-btleffect002.png",
            frameConfig: {
                frameWidth: 120,  //横幅
                frameHeight: 120, //縦幅　指定が無い場合は横幅の値が使用される
                startFrame: 0,   //解析の最初のフレーム
                endFrame: 8,    //最後のフレーム　指定無しの場合はフレーム幅で分割計算される
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

        this.load.spritesheet({
            key: 'tex_WindCutter',
            url: "/assets/img/spritesheet/pipo-btleffect161.png",
            frameConfig: {
                frameWidth: 192,  //横幅
                frameHeight: 192, //縦幅　指定が無い場合は横幅の値が使用される
                startFrame: 0,   //解析の最初のフレーム
                endFrame: 9,    //最後のフレーム　指定無しの場合はフレーム幅で分割計算される
                margin: 0,       //余白　フレームの端のスペース
                spacing: 0 //各フレームの間隔。
            }
        });

        this.load.audio('bgm_otobokeDance', 'assets/sound/おとぼけダンス(Silly_dance).mp3');
        //https://dova-s.jp/bgm/play17179.html

        this.load.audio('bgm_aruges', 'assets/sound/悪魔軍特攻隊長～電影のアルゲス～.mp3');
        //https://dova-s.jp/bgm/play18480.html

        this.load.audio('bgm_Cave', 'assets/sound/The Cave.mp3');
        //https://opengameart.org/content/rpg-the-cave-ambient

        this.load.audio('bgm_CrystalCave', 'assets/sound/Crystal Cave.mp3');
        //https://opengameart.org/content/crystal-cave-song18

        this.load.audio('SE_waterFall', 'assets/sound/滝1.mp3');
        this.load.audio('SE_doukutu', 'assets/sound/薄青い洞窟.mp3');
        this.load.audio('SE_fire', 'assets/sound/火炎魔法1.mp3');
        this.load.audio('SE_smallPunch', 'assets/sound/小パンチ.mp3');
        this.load.audio('SE_punch', 'assets/sound/重いパンチ1.mp3');
        this.load.audio('SE_karuipunch', 'assets/sound/軽いパンチ1.mp3');
        this.load.audio('SE_attack', 'assets/sound/打撃3.mp3');
        this.load.audio('SE_attack6', 'assets/sound/打撃6.mp3');
        this.load.audio('SE_victory', 'assets/sound/回復魔法4.mp3');
        this.load.audio('SE_message', 'assets/sound/メッセージ表示音3.mp3');
        this.load.audio('SE_chestOpen', 'assets/sound/受話器を置く.mp3');
        this.load.audio('SE_windCutter', 'assets/sound/刀で斬る3.mp3');
        this.load.audio('SE_jajaann', 'assets/sound/ジャジャーン.mp3');
        this.load.audio('SE_newsTitle', 'assets/sound/ニュースタイトル表示1.mp3');
        this.load.audio('SE_decideButton', 'assets/sound/決定ボタンを押す44.mp3');
        this.load.audio('SE_cancelButton', 'assets/sound/キャンセル4.mp3');
        // this.load.audio('SE_cardTurnOver', 'assets/sound/カードをめくる.mp3');
        this.load.audio('SE_idea', 'assets/sound/ひらめく2.mp3');
        this.load.audio('SE_syakiin', 'assets/sound/シャキーン3.mp3');
        this.load.audio('SE_cardOpen', 'assets/sound/カードを扇状に開く.mp3');
        this.load.audio('SE_bookClose', 'assets/sound/本を閉じる1.mp3');
        this.load.audio('SE_Beep5', 'assets/sound/ビープ音5.mp3');
        this.load.audio('SE_decisionButton15', 'assets/sound/決定ボタンを押す15.mp3');
        this.load.audio('SE_boosterJump1', 'assets/sound/ブースタージャンプ1.mp3');
        this.load.audio('SE_highSpeedMove', 'assets/sound/高速移動.mp3');
        //https://soundeffect-lab.info/sound/battle/

        // this.load.video('meina_video', 'assets/video/ComfyUI_00010_.mp4');
        // this.load.video('lamy1_video', 'assets/video/ComfyUI_00018_.mp4');
        // this.load.video('lamy2_video', 'assets/video/vidu-video-3213668993097372.mp4');

        //タイル画像のロード
        //データ内のタイルセット画像のURLの一部を書き換える。配置を変更する場合は注意。
        // this.cache.tilemap.getKeys().forEach(key => {
        //     // console.log(this.cache.tilemap.get(key).data.tilesets)
        //     const tilesets: tilesets[] = this.cache.tilemap.get(key).data.tilesets;
        //     tilesets.forEach(obj => {
        //         const tileKey = obj.name;
        //         const tileUrl = obj.image.replace('..', 'assets');
        //         this.load.image({ key: tileKey, url: tileUrl });
        //     })
        // })

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

            //状態更新
            manager.updateState({ state: State.FIELD }, data.sceneKey)

            // New Game以外の場合は仮想パッドを表示
            // ※最初のイベント時はUI表示せず、イベント側で表示処理する
            if (data.sceneKey !== 'New Game') {
                this.scene.wake('UI');
            };

            //仮想パッド設定
            if (!manager.isVirtualPad) {
                this.game.events.emit('UI_VISIBLE_FALSE');
            }

            console.log('load complete')

            this.scene.stop();
        });

        // アセットのロードを開始（preload外でロードを行う場合はこのメソッドを呼ぶ必要がある）
        this.load.start();
    }
}
