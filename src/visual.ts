import "../style/visual.less";
import { DB, Parser, Player } from "svga";
import { Subject, concatMap, from } from "rxjs";

import BOATSVGA from "../assets/boat.svga";
import CLOUDSVGA from "../assets/cloud.svga";
import { Video } from "svga/dist/types";

const SVGALIST = [BOATSVGA, CLOUDSVGA];

export default class Visual extends WynVisual {
  private player: Player;
  private canvas: HTMLCanvasElement;
  private db: DB;
  private subject: Subject<any>;
  private keyName: string;
  private textName: string;
  private statuName: string;
  constructor(
    dom: HTMLDivElement,
    host: VisualNS.VisualHost,
    options: VisualNS.IVisualUpdateOptions
  ) {
    super(dom, host, options);
    this.canvas = document.createElement("canvas");
    dom.appendChild(this.canvas);
    this.db = new DB();
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
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
                let url = SVGALIST[0];
                this.player.onEnd = () => {
                  resolve(0);
                };
                this.findSVGA(url).then((svga) => {
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
        svga = await parser.load(url);
        await this.db.insert(url, svga);
      }
    } catch (error) {
      console.error("find svga error:", error);
    }
    return svga;
  }

  public update(options: VisualNS.IVisualUpdateOptions) {
    const plainDataView = options.dataViews[0] && options.dataViews[0].plain;

    if (
      plainDataView &&
      plainDataView.profile.category.values.length != 0 &&
      plainDataView.profile.values.values.length != 0
    ) {
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
