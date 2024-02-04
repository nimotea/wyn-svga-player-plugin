import "../style/visual.less";
import { DB, Parser, Player } from "svga";
import { Subject, concatMap, from } from "rxjs";

import BOATSVGA from "../assets/boat.svga";
import CLOUDSVGA from "../assets/cloud.svga";
import LOGO from "../assets/logo.jpg";

import { Video } from "svga/dist/types";
import { svgaList } from "./svgaList";

const SVGALIST = ['boat', 'cloud'];
const CUSTOMESVGS = "customeSVGA";
const FIELDVALUE = "fiedValue";
const SVGATYPE = "svgaType";
const DEFAULTSVGA ="boat";

export default class Visual extends WynVisual {
  private player: Player;
  private canvas: HTMLCanvasElement;
  private db: DB;
  private subject: Subject<any>;
  private keyName: string;
  private textName: string;
  private statuName: string;
  private properties : any;
  // html element
  private giver: HTMLDivElement;
  private img: HTMLImageElement;
  private text: Text;
  private giverGift: HTMLSpanElement;
  private giverName: HTMLDivElement;
  private msgContent: HTMLDivElement;
  private constructor(
    dom: HTMLDivElement,
    host: VisualNS.VisualHost,
    options: VisualNS.IVisualUpdateOptions
  ) {
    super(dom, host, options);
    dom.style.overflow = "hidden";
    this.initDom(dom);

    let div = document.createElement("div");
    div.style.display = 'flex';
    div.style.justifyContent = 'center';
    this.canvas = document.createElement("canvas");
    this.canvas.style.width = "33.3%";
    this.canvas.style.height = "100%";

    div.appendChild(this.canvas);
    dom.appendChild(div);
    this.db = new DB();
    this.subject = new Subject();
    // pre-fetch svga
    SVGALIST.forEach((svga) => {
      this.findSVGA(svga);
    });
    this.player = new Player(this.canvas);
    this.player.setConfig({
      loop: 1,
    });

    this.subject
      .pipe(
        concatMap((dataViews) => {
          return from(dataViews).pipe(
            concatMap((data) => {
              return new Promise((resolve) => {
                let name = data[this.keyName];
                let gift = this.properties[data[this.keyName]] || DEFAULTSVGA;
                let url = svgaList(gift);
                this.player.onEnd = () => {
                  this.giver.classList.remove("giver-show");
                  resolve(0);
                };
                this.findSVGA(gift).then((svga) => {

                  this.giverName.innerText = name;
                  this.giverGift.innerText = url.name;
                  this.giver.classList.add("giver-show");

                  this.player.mount(svga);
                  this.player.start();
                });
              });
            })
          );
        })
      )
      .subscribe();
  }

  private async findSVGA(url: string): Promise<Video> {
    let svga = null;
    try {
      await this.db.find(url);
      if (!svga) {
        const parser = new Parser({ isDisableImageBitmapShim: true });
        svga = await parser.load(svgaList(url).svga);
        await this.db.insert(url, svga);
      }
    } catch (error) {
      console.error("find svga error:", error);
    }
    return svga;
  }

  private initDom(dom:HTMLDivElement){
    this.giver = document.createElement("div");
    this.img = document.createElement("img");
    this.giverName = document.createElement("div");
    this.msgContent = document.createElement("div");
    this.giverGift = document.createElement("span");
    this.text = document.createTextNode("送的");
    this.giver.classList.add("giver-normal");
    this.giver.id = "giver";
    this.giverName.style.fontSize = '30px';
    this.msgContent.appendChild(this.text);
    this.msgContent.appendChild(this.giverGift);
    this.msgContent.style.fontSize = '20px';
    this.img.src = LOGO;
    dom.appendChild(this.giver);
    this.giver.appendChild(this.img);
    this.giver.appendChild(this.giverName);
    this.giver.appendChild(this.msgContent);


  }

  public update(options: VisualNS.IVisualUpdateOptions) {
    const plainDataView = options.dataViews[0] && options.dataViews[0].plain;

    if (
      plainDataView &&
      plainDataView.profile.category.values.length != 0 &&
      plainDataView.profile.values.values.length != 0
    ) {
      this.properties = options.properties[CUSTOMESVGS].reduce((arr,item)=>({
        ...arr,
        [item[FIELDVALUE]] : item[SVGATYPE]
      }),{});
      this.keyName = plainDataView.profile.category.values[0].display;
      this.textName = plainDataView.profile.values.values[0].display;
      this.subject.next(plainDataView.data);
    }
  }

  public onDestroy(): void {}

  public getInspectorHiddenState(
    options: VisualNS.IVisualUpdateOptions
  ): string[] {
    return null;
  }

  public getActionBarHiddenState(
    options: VisualNS.IVisualUpdateOptions
  ): string[] {
    return null;
  }

  public getColorAssignmentConfigMapping(
    dataViews: VisualNS.IDataView[]
  ): VisualNS.IColorAssignmentConfigMapping {
    return null;
  }
}
