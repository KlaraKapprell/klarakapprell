let menuIconSketch = (p) => {
  let rotationAngle = 0;
  let rotationSpeed = 2;
  let canvasSize; // Dynamically set size
  let baseSize = 50; // Reference size for scaling

  let blinkInterval;
  let lastBlinkTime;
  let blinking = false;
  let blinkDuration = 200;

  p.setup = () => {
    updateCanvasSize();
    let canvas = p.createCanvas(canvasSize, canvasSize);
    canvas.parent('menu-icon');
    p.pixelDensity(5);

    p.angleMode(p.DEGREES);

    blinkInterval = getRandomBlinkInterval();
    lastBlinkTime = p.millis();
  };

  p.draw = () => {
    p.clear();
    p.translate(canvasSize / 2, canvasSize / 2); // Center the drawing

    let scaleFactor = Math.max(0.2, canvasSize / baseSize); // Ensures smooth scaling

    let now = p.millis();
    if (now - lastBlinkTime > blinkInterval) {
      blinking = true;
      lastBlinkTime = now;
    }

    if (blinking && now - lastBlinkTime > blinkDuration) {
      blinking = false;
      blinkInterval = getRandomBlinkInterval();
    }

    // Oscillate rotation back and forth using sine wave
    rotationAngle = p.sin(p.frameCount * rotationSpeed) * 15; 

    p.push();
    p.scale(scaleFactor); // Apply global scaling
    p.rotate(rotationAngle); 

    let numArms = 12;
    let armLength = 24; 
    let arcSpan = 90;
    let minStrokeIncrease = 4;
    let maxStrokeIncrease = 5;
    let minStrokeDecrease = 2;
    let maxStrokeDecrease = 4;
    let steps = 30;

    for (let i = 0; i < numArms; i++) {
      let angle = i * (360 / numArms);
      let arcY = p.cos(angle) * -armLength;
      let increasing = arcY > 0;

      p.push();
      p.rotate(angle);

      for (let j = 0; j < steps; j++) {
        let t = j / (steps - 1);
        let weight = increasing 
          ? p.lerp(minStrokeIncrease, maxStrokeIncrease, t) * scaleFactor
          : p.lerp(maxStrokeDecrease, minStrokeDecrease, t) * scaleFactor;

        p.strokeWeight(weight);
        let startAngle = p.lerp(-arcSpan, arcSpan / 2, t);
        let endAngle = startAngle + (arcSpan / steps);

        p.noFill();
        p.stroke(255, 30, 255);
        p.arc(0, armLength / 2, armLength, armLength, startAngle, endAngle);
      }
      p.pop();
    }
    p.pop();

    // Draw eyes
    p.push();
    p.scale(scaleFactor);
    p.strokeWeight(Math.max(0.5, 1 * scaleFactor));
    p.stroke(0);
    p.strokeWeight(1);
    p.fill(255);
    
    if (!blinking) {
      p.ellipse(6, 0, 10);
      p.ellipse(-6, 0, 10);
      
      p.noStroke();
      p.fill(0);
      p.ellipse(6, 0, 6);
      p.ellipse(-6, 0, 6);
    } else {
      p.stroke(0);
      p.strokeWeight(2 * scaleFactor);
      p.line(1, 0, 11, 0);
      p.line(-1, 0, -11, 0);
    }
    p.pop();
  };

  function getRandomBlinkInterval() {
    return p.random(3000, 10000);
  }

  function updateCanvasSize() {
    canvasSize = Math.max(45, Math.min(window.innerWidth * 0.1, 50)); // Scale dynamically
  }

  // Resize canvas when the window is resized
  p.windowResized = () => {
    updateCanvasSize();
    p.resizeCanvas(canvasSize, canvasSize);
  };
};

new p5(menuIconSketch);
