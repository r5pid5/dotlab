// Each effect starts from its own settings; values from a different filter never leak in.
export const effectSettings = {
 halftone:{size:5,strength:100,density:115,colored:false,color:'#17171a',paper:'#fffdf5',angle:45},
 ring:{size:7,strength:75,density:95,colored:true,paper:'#fbf9ee'},
 beads:{size:10,strength:90,colored:true,paper:'#e9efdf'},
 ascii:{size:9,strength:100,density:120,colored:false,color:'#202327',paper:'#f4f1e8'},
 scanlines:{size:5,strength:60,color:'#10141b'},pixel:{size:8,strength:100},
 duotone:{strength:100,color:'#282452',paper:'#f2c6dc'},grain:{size:4,strength:65},
 liquid:{size:20,strength:100,density:100,color:'#b9e84e',coverage:32,flow:0,angle:0,offsetX:0,offsetY:0},
 glow:{size:13,strength:90,bloom:52,noise:18,aberration:3,density:112},
 grunge:{size:5,strength:100,bloom:28,noise:36,scratches:24,density:132,color:'#111a21',paper:'#e9fbff',aberration:1},
 poster:{strength:100,color:'#222321',paper:'#f7f5e8',noise:27,density:128},
 fisheye:{strength:100,color:'#101014',density:140},
 lineart:{strength:100,color:'#ffffff',paper:'#182223',size:10,density:95,lineOverlay:true,lineWidth:1.3},
 punk:{strength:100,color:'#131417',paper:'#fffaf1',noise:36,density:108},
 pastel:{strength:90,size:14,bloom:38,noise:19,density:95},
 dither:{strength:100,colors:4,dotSize:3,palette:'ice',dither:'floyd'},
 prism:{strength:85,angle:-25,spread:80,bloom:35,density:90}
};
export function clearDecorations(state){
 state.pattern.enabled=false;state.pattern.cutout=false;state.block.enabled=false;
 state.punch.enabled=false;state.frame.type='none';state.mockup.enabled=false;
 state.word.enabled=false;state.calendar.enabled=false;state.wire.enabled=false;
 state.nodes=[];state.paperTexture=0;state.composition='overlay';
}
