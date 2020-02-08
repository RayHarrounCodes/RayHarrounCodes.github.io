// https://observablehq.com/@mbostock/top-100-cities@263
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md`# Top 100 Cities

A tour of the most populous cities in the world. Data: [Natural Earth](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-populated-places/)`
)});
  main.variable(observer()).define(["city","html"], function(city,html){return(
city ? html`<div style="display:block;text-align:center;"><b>${city.properties.name}, ${city.properties.adm0name}</b> #${city.properties.rank} <br>Population ${city.properties.pop_max.toLocaleString()}` : html``
)});
  main.variable(observer("canvas")).define("canvas", ["DOM","width","height","d3","sphere","land","borders","cities","mutable city","tilt","Versor"], async function*(DOM,width,height,d3,sphere,land,borders,cities,$0,tilt,Versor)
{
  const context = DOM.context2d(width, height);
  const projection = d3.geoOrthographic().fitExtent([[10, 10], [width - 10, height - 10]], sphere).precision(0.2);
  const path = d3.geoPath(projection, context).pointRadius(1.5);

  function render(arc) {
    context.clearRect(0, 0, width, height);
    context.beginPath(), path(land), context.fillStyle = "#ccc", context.fill();
    context.beginPath(), path(borders), context.strokeStyle = "#fff", context.lineWidth = 0.5, context.stroke();
    context.beginPath(), path(sphere), context.strokeStyle = "#000", context.lineWidth = 1.5, context.stroke();
    context.beginPath(), path(cities), context.fillStyle = "#000", context.fill();
    context.beginPath(), path(arc), context.stroke();
    return context.canvas;
  }

  let p1, p2, r1, r2;
  for (const city of cities.features.slice().reverse()) {
    $0.value = city;
    yield render();

    p1 = p2, p2 = city.geometry.coordinates;
    r1 = r2, r2 = [-p2[0], tilt - p2[1], 0];
    const ip = d3.geoInterpolate(p1 || p2, p2);
    const iv = Versor.interpolateAngles(r1 || r2, r2);

    await d3.transition()
        .duration(1250)
        .tween("render", () => t => {
          projection.rotate(iv(t));
          render({type: "LineString", coordinates: [p1 || p2, ip(t)]});
        })
      .transition()
        .tween("render", () => t => {
          render({type: "LineString", coordinates: [ip(t), p2]});
        })
      .end();
  }
}
);
  main.variable(observer("Versor")).define("Versor", function(){return(
class Versor {
  static fromAngles([l, p, g]) {
    l *= Math.PI / 360;
    p *= Math.PI / 360;
    g *= Math.PI / 360;
    const sl = Math.sin(l), cl = Math.cos(l);
    const sp = Math.sin(p), cp = Math.cos(p);
    const sg = Math.sin(g), cg = Math.cos(g);
    return [
      cl * cp * cg + sl * sp * sg,
      sl * cp * cg - cl * sp * sg,
      cl * sp * cg + sl * cp * sg,
      cl * cp * sg - sl * sp * cg
    ];
  }
  static toAngles([a, b, c, d]) {
    return [
      Math.atan2(2 * (a * b + c * d), 1 - 2 * (b * b + c * c)) * 180 / Math.PI,
      Math.asin(Math.max(-1, Math.min(1, 2 * (a * c - d * b)))) * 180 / Math.PI,
      Math.atan2(2 * (a * d + b * c), 1 - 2 * (c * c + d * d)) * 180 / Math.PI
    ];
  }
  static interpolateAngles(a, b) {
    const i = Versor.interpolate(Versor.fromAngles(a), Versor.fromAngles(b));
    return t => Versor.toAngles(i(t));
  }
  static interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    a2 -= a1, b2 -= b1, c2 -= c1, d2 -= d1;
    const x = new Array(4);
    return t => {
      const l = Math.hypot(x[0] = a1 + a2 * t, x[1] = b1 + b2 * t, x[2] = c1 + c2 * t, x[3] = d1 + d2 * t);
      x[0] /= l, x[1] /= l, x[2] /= l, x[3] /= l;
      return x;
    };
  }
  static interpolate([a1, b1, c1, d1], [a2, b2, c2, d2]) {
    let dot = a1 * a2 + b1 * b2 + c1 * c2 + d1 * d2;
    if (dot < 0) a2 = -a2, b2 = -b2, c2 = -c2, d2 = -d2, dot = -dot;
    if (dot > 0.9995) return Versor.interpolateLinear([a1, b1, c1, d1], [a2, b2, c2, d2]); 
    const theta0 = Math.acos(Math.max(-1, Math.min(1, dot)));
    const x = new Array(4);
    const l = Math.hypot(a2 -= a1 * dot, b2 -= b1 * dot, c2 -= c1 * dot, d2 -= d1 * dot);
    a2 /= l, b2 /= l, c2 /= l, d2 /= l;
    return t => {
      const theta = theta0 * t;
      const s = Math.sin(theta);
      const c = Math.cos(theta);
      x[0] = a1 * c + a2 * s;
      x[1] = b1 * c + b2 * s;
      x[2] = c1 * c + c2 * s;
      x[3] = d1 * c + d2 * s;
      return x;
    };
  }
}
)});
  main.define("initial city", function(){return(
null
)});
  main.variable(observer("mutable city")).define("mutable city", ["Mutable", "initial city"], (M, _) => new M(_));
  main.variable(observer("city")).define("city", ["mutable city"], _ => _.generator);
  main.variable(observer("height")).define("height", ["width"], function(width){return(
Math.min(width, 720)
)});
  main.variable(observer("tilt")).define("tilt", function(){return(
20
)});
  main.variable(observer("sphere")).define("sphere", function(){return(
{type: "Sphere"}
)});
  main.variable(observer("cities")).define("cities", ["d3"], async function(d3)
{
  const cities = await d3.json("https://gist.githubusercontent.com/mbostock/ead0eec27ed87b0d39426a6229dc06eb/raw/35c9fbf28ec8090eeff35423d0bbc6432c80229c/cities-100.json");
  cities.features.forEach((d, i) => d.properties.rank = i + 1);
  return cities;
}
);
  main.variable(observer("borders")).define("borders", ["topojson","world"], function(topojson,world){return(
topojson.mesh(world, world.objects.countries, (a, b) => a !== b)
)});
  main.variable(observer("land")).define("land", ["topojson","world"], function(topojson,world){return(
topojson.feature(world, world.objects.land)
)});
  main.variable(observer("world")).define("world", ["d3"], function(d3){return(
d3.json("https://cdn.jsdelivr.net/npm/world-atlas@1/world/110m.json")
)});
  main.variable(observer("topojson")).define("topojson", ["require"], function(require){return(
require("topojson-client@3")
)});
  main.variable(observer("d3")).define("d3", ["require"], function(require){return(
require("d3@5")
)});
  return main;
}
