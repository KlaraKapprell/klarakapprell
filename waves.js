const waveSketch = (p) => {
  let ySpacing = 7;
  let w;
  let theta = 0.0;
  let amplitude = 40;
  let period = 300.0;
  let dx;
  let yvalues;
  let waveSpace = 40;
  let grow = 0;
  let myList;
  let shapeList;

  p.setup = function () {
    p.createCanvas(window.innerWidth, window.innerHeight);
    updateWaveProperties();
    p.noStroke();
    myList = Array.from({ length: 100 }, () => p.random(0.5, 1));
    shapeList = Array.from({ length: 100 }, () => p.random(["vertex", "ellipse"]));
  };

  p.draw = function () {
    p.clear();
    calcWave();
    renderWave();
  };

  function updateWaveProperties() {
    w = p.height * 2;
    dx = (p.TWO_PI / period) * ySpacing;
    yvalues = new Array(Math.floor(w / ySpacing));
  }

  function calcWave() {
    theta += 0.02;
    let x = theta;
    for (let i = 0; i < yvalues.length; i++) {
      let angle = p.atan2(p.mouseY - p.height / 2, p.mouseX - p.width / 2);
      yvalues[i] = p.sin(x + angle) * amplitude;
      x += dx;
    }
  }

  function renderWave() {
    for (let i = 0; i < 100; i++) {
      if (shapeList[i] === "vertex") {
        p.beginShape();
        p.stroke(210, 250, 0);
        p.strokeWeight(10);
        p.noFill();
        for (let y = 0; y < yvalues.length * myList[i] * grow; y++) {
          let waveX = -50 + yvalues[y] + i * waveSpace;
          let waveY = y * -ySpacing + p.height;
          p.vertex(waveX, waveY);
        }
        p.endShape();
      } else {
        p.noStroke();
        p.fill(210, 250, 0);
        for (let y = 0; y < yvalues.length * myList[i] * grow; y++) {
          let waveX = -50 + yvalues[y] + i * waveSpace;
          let waveY = y * -ySpacing + p.height;
          p.ellipse(waveX, waveY, 15, 15);
        }
        p.stroke(210, 240, 0);
        p.noFill();
      }
    }
    grow = Math.min(grow + 0.01, 0.4);
  }

  p.windowResized = function () {
    p.resizeCanvas(window.innerWidth, window.innerHeight);
    updateWaveProperties(); // Recalculate wave properties when the window size changes
  };
};
