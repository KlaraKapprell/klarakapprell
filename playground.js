let playgroundSketch = (p) => {
  let points = 6;
  let baseRadius = 10;
  let freezeDuration = 1000;
  let morphDuration = 1000;
  let lastUpdateTime = 0;
  let morphing = false;
  let lerpAmt = 0;

  let oldOffsets = [];
  let newOffsets = [];
  let oldCircleSizes = [];
  let newCircleSizes = [];
  let oldEyeIndex;
  let newEyeIndex;
  const eyeSize = 20;

  let blinkInterval;
  let lastBlinkTime;
  let blinking = false;
  let blinkDuration = 200;

  let bubbles = [];
  let numBubbles = 10;
  let popCount = 0;
  let popMessage;
  let lastPopTime = 0;
  let messageVisible = false;

  let bubbleMachineX;
  let bubbleMachineY;
  let bubbleMachineEllipses = [];
  let bubbleSpawnArea = { x: 0, y: 0, w: 75, h: 20 };

  let hideP5Cursor = false;
  let cursorOpacity = 255; // Opacity variable for fade effect
  let fadeSpeed = 0.15; // Speed of fade effect

  let touchX = null;
  let touchY = null;
  let touchStartX = null;
  let touchStartY = null;
  const dragThreshold = 10; // Minimum movement to be considered a drag
  let hasDragged = false;
  let isTouchActive = false;
  let defaultX;
  let defaultY;
  let instructionText;
  let hasMovedBlob = false;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  p.setup = () => {
    let newWidth = document.body.clientWidth;
    let newHeight = document.body.clientHeight;
    let canvas = p.createCanvas(newWidth, newHeight);
    canvas.parent("playground");
    p.noCursor();

    canvas.elt.style.pointerEvents = "none";

    // Set default cursor start position (center of the screen)
    defaultX = newWidth / 2 + newWidth * 0.3;
    defaultY = newHeight / 2 + newHeight * 0.15;
    // Initialize cursor position
    touchX = defaultX;
    touchY = defaultY;

     // Show message only on mobile devices
     if (isTouchDevice) {
      instructionText = p.createDiv("Move the blob<br>to catch the bubbles.")
        .style("font-size", "clamp(24px, 5vw, 32px)")
        .style("text-align", "center")
        .style("position", "absolute")
        .style("top", "35%")
        .style("left", "50%")
        .style("transform", "translateX(-50%)")
        .style("color", "black")
        .style("background-color", "rgb(210, 240, 0)")
        .style("padding", "10px 15px")
        .style("border-radius", "30px")
        .style("white-space", "nowrap")
        .style("z-index", "999"); 
    }

    popCount = 0;

    popMessage = p.createDiv("")
      .style("font-size", "clamp(24px, 5vw, 32px)")
      .style("text-align", "center")
      .style("position", "absolute")
      .style("top", "50px").style("left", "50%")
      .style("transform", "translateX(-50%)")
      .style("color", "black")
      .hide();

    updateBubbleMachine();

    bubbleSpawnArea.w = 75;
    bubbleSpawnArea.h = 20;

    generateNewShape();
    oldOffsets = [...newOffsets];
    oldCircleSizes = [...newCircleSizes];
    oldEyeIndex = pickValidEyeIndex();
    newEyeIndex = oldEyeIndex;

    blinkInterval = getRandomBlinkInterval();
    lastBlinkTime = p.millis();

    for (let i = 0; i < numBubbles; i++) {
      let spawnPoint = getBubbleSpawnPoint();
      bubbles.push(new Bubble(spawnPoint.x, spawnPoint.y, p.random(15, 40)));
    }
  };

  p.draw = () => {
    p.clear();

    // Check if touch is near any button
    let isNearButton = isTouchNearButton();
    
    if (!isNearButton) {
        let cursorX = isTouchActive ? touchX : p.mouseX || defaultX;
        let cursorY = isTouchActive ? touchY : p.mouseY || defaultY;
        drawCursor(cursorX, cursorY);
    }

    // Check if the mouse is near any button
    let shouldHideCursor = isMouseNearButton();

    // Smoothly transition cursor opacity
    cursorOpacity = p.lerp(cursorOpacity, shouldHideCursor ? 0 : 255, fadeSpeed);

    // Show or hide system cursor when fully faded out
    if (cursorOpacity < 5) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "none";
    }
  
    drawBackgroundPicture();

    drawBubbleMachine();

    if (messageVisible && p.millis() - lastPopTime > 2000) {
      popMessage.hide();
      messageVisible = false;
    }

    for (let i = bubbles.length - 1; i >= 0; i--) {
      bubbles[i].update();
      bubbles[i].display();

      if (bubbles[i].isCaught(p.mouseX, p.mouseY)) {
        bubbles.splice(i, 1);
        let spawnPoint = getBubbleSpawnPoint();
        bubbles.push(new Bubble(spawnPoint.x, spawnPoint.y));
        bubblePopped();
      }
    }

    // Determine cursor position
    let cursorX = isTouchActive ? touchX : p.mouseX || defaultX;
    let cursorY = isTouchActive ? touchY : p.mouseY || defaultY;

    // Only draw the p5 cursor if it's not fully faded
    if (cursorOpacity > 5) {
      drawCursor(cursorX, cursorY);
    }
  };

  p.windowResized = () => {
    let newWidth = document.body.clientWidth;
    let newHeight = document.body.clientHeight;
    p.resizeCanvas(newWidth, newHeight);
    updateBubbleMachine();
  };

  function isTouchNearButton() {
    let buttons = document.querySelectorAll("nav a, footer a");
    for (let btn of buttons) {
        let rect = btn.getBoundingClientRect();
        if (
            touchX >= rect.left &&
            touchX <= rect.right &&
            touchY >= rect.top &&
            touchY <= rect.bottom
        ) {
            return true;
        }
    }
    return false;
  }

  function updateBubbleMachine() {
     // Update bubble machine position
     bubbleMachineX = p.width / 2;
     bubbleMachineY = p.height - 130;
   
     // Update bubble machine ellipses
     bubbleMachineEllipses = [
       { x: bubbleMachineX, y: bubbleMachineY, w: 150, h: 40 },
       { x: bubbleMachineX, y: bubbleMachineY + 30, w: 150, h: 40 },
       { x: bubbleMachineX, y: bubbleMachineY + 60, w: 150, h: 40 }
     ];
   
     // Update bubble spawn area
     bubbleSpawnArea.x = bubbleMachineX;
     bubbleSpawnArea.y = bubbleMachineY;
  }

  function isMouseNearButton() {
    let paddingX = 10; // Padding only on the x-axis
    let buttons = document.querySelectorAll("nav a, footer a");

    for (let btn of buttons) {
        let rect = btn.getBoundingClientRect();
        if (
            p.mouseX >= rect.left - paddingX && // Extend padding on left
            p.mouseX <= rect.right + paddingX && // Extend padding on right
            p.mouseY >= rect.top && // No padding on y-axis
            p.mouseY <= rect.bottom // No padding on y-axis
        ) {
            return true;
        }
    }
    return false;
}

  function drawBackgroundPicture() {
    let arcHeight = p.height;
    let arcWidth = arcHeight * (450 / 950);

    p.push();
    p.translate(p.width / 2, p.height - 70);
    p.fill(0);
    p.noStroke();
    p.arc(0, 0, arcWidth, arcHeight, p.PI, 0);
    p.pop();
  }
  

  function drawBubbleMachine() {
    p.push();
    p.fill(255, 80, 0);
    p.noStroke();
    for (let e of bubbleMachineEllipses) {
      p.ellipse(e.x, e.y, e.w, e.h);
    }
    p.fill(255, 90, 255);
    p.stroke(0);
    p.strokeWeight(1.5);
    p.ellipse(bubbleSpawnArea.x, bubbleSpawnArea.y, bubbleSpawnArea.w, bubbleSpawnArea.h);
    p.pop();
  }

  function getBubbleSpawnPoint() {
    return { x: bubbleSpawnArea.x, y: bubbleSpawnArea.y };
  }

  p.touchStarted = () => {
    if (p.touches.length > 0) {
        let tX = p.touches[0].x;
        let tY = p.touches[0].y;

        touchStartX = tX;
        touchStartY = tY;
        hasDragged = false;
        isTouchActive = false;

        // Check if the touch is inside the blob
        let d = p.dist(tX, tY, touchX, touchY); 
        let blobRadius = 25; // Approximate size of the blob
        if (d < blobRadius) {
            isTouchActive = true; // Activate dragging only if touch is on the blob
            return false; // Prevents default touch behavior (scrolling)
        }
    }
    return true; // Allows normal scrolling if touch is not on the blob
};

p.touchMoved = () => {
    if (isTouchActive && p.touches.length > 0) {
        let tX = p.touches[0].x;
        let tY = p.touches[0].y;

        let dx = Math.abs(tX - touchStartX);
        let dy = Math.abs(tY - touchStartY);

        if (dx > dragThreshold || dy > dragThreshold) {
            hasDragged = true;
            touchX = tX;
            touchY = tY;
            hasMovedBlob = true;

            if (instructionText) {
                instructionText.hide();
            }

            return false; // Prevent scrolling while dragging the blob
        }
    }
    return true; // Allow scrolling when not dragging
};

p.touchEnded = () => {
    isTouchActive = false;
    return true; // Allow normal touch behavior when releasing
};

  function drawCursor(x, y) {
    if (hideP5Cursor) return; // Don't draw if mouse is over a button

    p.push();
    if (isTouchDevice) {
      p.translate(
        hasDragged ? x : touchX, // Use the last dragged position on touch devices
        hasDragged ? y : touchY
      );
     } else {
        p.translate(x, y);
     }
    p.fill(210, 250, 0, cursorOpacity);
    p.noStroke();

    p.ellipse(0, 0, 50);

    let now = p.millis();
    let elapsedTime = now - lastUpdateTime;

    if (!morphing && elapsedTime > freezeDuration) {
      morphing = true;
      lastUpdateTime = now;
      lerpAmt = 0;
      oldOffsets = [...newOffsets];
      oldCircleSizes = [...newCircleSizes];
      oldEyeIndex = newEyeIndex;
      generateNewShape();
      newEyeIndex = oldEyeIndex;
    }

    if (morphing) {
      lerpAmt = p.min(lerpAmt + 1 / (morphDuration / 16), 1);
      if (lerpAmt >= 1) {
        morphing = false;
        lastUpdateTime = now;
      }
    }

    if (now - lastBlinkTime > blinkInterval) {
      blinking = true;
      lastBlinkTime = now;
    }

    if (blinking && now - lastBlinkTime > blinkDuration) {
      blinking = false;
      blinkInterval = getRandomBlinkInterval();
    }


    let maxRadius = 0;
    for (let i = 0; i < points; i++) {
      let rOld = baseRadius + oldOffsets[i];
      let rNew = baseRadius + newOffsets[i];
      let r = p.lerp(rOld, rNew, lerpAmt);
      let sizeOld = oldCircleSizes[i];
      let sizeNew = newCircleSizes[i];
      let circleSize = p.lerp(sizeOld, sizeNew, lerpAmt);
      maxRadius = p.max(maxRadius, r + circleSize / 2);
    }
  
    let scaleFactor = (25) / maxRadius;
    let eyeX = 0, eyeY = 0;

    for (let i = 0; i < points; i++) {
      let angle = p.map(i, 0, points, 0, p.TWO_PI);
      
      // Restore independent morphing without scaling `r`
      let rOld = baseRadius + oldOffsets[i];
      let rNew = baseRadius + newOffsets[i];
      let r = p.lerp(rOld, rNew, lerpAmt);
  
      let x = r * p.cos(angle);
      let y = r * p.sin(angle);
  
      // Keep circle sizes independent from scaling
      let sizeOld = oldCircleSizes[i];
      let sizeNew = newCircleSizes[i];
      let circleSize = p.lerp(sizeOld, sizeNew, lerpAmt);
  
      p.ellipse(x, y, circleSize);
  
      if (i === oldEyeIndex || i === newEyeIndex) { 
        eyeX = x;
        eyeY = y;
      }
    }
  

    if (!blinking) {
      p.fill(255, cursorOpacity);
      p.stroke(0, cursorOpacity);
      p.strokeWeight(1.5);
      let eyeOffset = eyeSize * 0.6;
      p.ellipse(eyeX - eyeOffset, eyeY, eyeSize, eyeSize);
      p.ellipse(eyeX + eyeOffset, eyeY, eyeSize, eyeSize);

      p.fill(0, cursorOpacity);
      p.noStroke();
      let pupilSize = eyeSize * 0.6;
      p.ellipse(eyeX - eyeOffset, eyeY, pupilSize, pupilSize);
      p.ellipse(eyeX + eyeOffset, eyeY, pupilSize, pupilSize);
    } else {
      p.stroke(0, cursorOpacity);
      p.strokeWeight(2);
      let eyeOffset = eyeSize * 0.6;
      p.line(eyeX - eyeOffset - eyeSize / 2, eyeY, eyeX - eyeOffset + eyeSize / 2, eyeY);
      p.line(eyeX + eyeOffset - eyeSize / 2, eyeY, eyeX + eyeOffset + eyeSize / 2, eyeY);
    }

    p.pop();
  }

  function bubblePopped() {
    if (isTouchDevice && !hasMovedBlob) return; // On mobile, do not show message until blob is moved

    popCount++;
    lastPopTime = p.millis();

    if (!messageVisible) {
      let minFontSize = 24;
      let maxFontSize = 36;
      let dynamicFontSize = p.constrain(window.innerWidth * 0.05, minFontSize, maxFontSize); 
      p.textSize(dynamicFontSize); 
      let textWidth = p.textWidth(`Yay! You popped ${popCount} bubbles.`);

      let safeZoneHeight = p.height * 0.5 - 70;
      let randomXMin = textWidth / 2 + 20;
      let randomXMax = p.width - textWidth / 2 - 20;
      let randomX = p.random(randomXMin, randomXMax);
      let randomY = p.random(150, safeZoneHeight - 100);

      popMessage.style("left", `${randomX}px`);
      popMessage.style("top", `${randomY}px`);
    }

    messageVisible = true;

    popMessage.style("padding", "10px");
    popMessage.style("background-color", "rgb(210, 240, 0)");
    popMessage.style("border-radius", "30px");
    popMessage.style("white-space", "nowrap");
    popMessage.style("opacity", "1");

    popMessage.html(`Yay! You popped <span style="color: rgb(255, 90, 255); font-weight: bold;">${popCount}</span> bubble${popCount > 1 ? "s" : ""}.`);
    popMessage.show();
  } 

  class Bubble {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.startSize = 20;
      this.maxSize = p.random(60, 100);
      this.size = this.startSize;
      this.growSpeed = p.random(0.1, 0.3);
      this.speed = p.random(1, 2);
      this.drift = p.random(-0.5, 0.5);
      this.opacity = 255;
    }
  
    update() {
      this.y -= this.speed;
      this.x += this.drift;
  
      if (this.size < this.maxSize) {
        this.size += this.growSpeed;
      }
  
      if (this.y < -this.size) {
        let spawnPoint = getBubbleSpawnPoint();
        this.reset(spawnPoint.x, spawnPoint.y);
      }
    }
  
    display() {
      p.push();
      p.translate(this.x, this.y);
      let dynamicStrokeWeight = p.map(this.size, this.startSize, this.maxSize, 1.25, 2);

      p.fill(255, 90, 255, 200);
      p.stroke(0);
      p.strokeWeight(dynamicStrokeWeight);
      p.ellipse(0, 0, this.size);
      
      if (this.size > 25) {
        let arcSize = this.size * 0.75;
        p.noFill();
        p.strokeCap(p.ROUND);
        p.arc(0, 0, arcSize, arcSize, p.PI + p.radians(10), p.TWO_PI - p.radians(90));
      }

        p.pop();
    }
  
    isCaught(cursorX, cursorY) {
      let d = p.dist(this.x, this.y, cursorX, cursorY);
      return d < this.size / 2 + 20;
    }
  
    reset(x, y) {
      this.x = x;
      this.y = y;
      this.size = this.startSize; 
      this.opacity = 255;
      this.drift = p.random(-0.5, 0.5);
    }
  }  

  function generateNewShape() {
    newOffsets = [];
    newCircleSizes = [];
    for (let i = 0; i < points; i++) {
      newOffsets.push(p.map(p.noise(p.random(1000)), 0, 5, -45, 45)); // Use p.map() and fix noise mapping
      newCircleSizes.push(p.random(35, 60)); // Varying circle sizes
    }
  }  

  function pickValidEyeIndex() {
    return p.floor(p.random(points));
  }

  function getRandomBlinkInterval() {
    return p.random(3000, 10000);
  }
};

new p5(playgroundSketch);
