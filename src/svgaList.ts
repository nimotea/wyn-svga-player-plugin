import BOATSVGA from "../assets/boat.svga";
import CLOUDSVGA from "../assets/cloud.svga";

export  function svgaList( type : string ){
    let svga;
    switch( type) {
        case "boat":
            svga = {
                name : "月亮船",
                svga : BOATSVGA
            }
            break;
        case "cloud":
            svga ={
                name : "气泡云",
                svga : CLOUDSVGA
            } ;
            break;
    }
    return svga;
}