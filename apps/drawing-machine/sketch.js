var possible_images;
var images = [];
var imgSizes = [];
var currentImageIndex = 0;
let myFont;
let isTouch = window.matchMedia('(pointer: coarse)').matches;
let maxTouches = 0; // meiste Finger gleichzeitig während einer Geste

function preload() {
  possible_images = [
    "figure1.png",
    "figure2.png",
    "figure3.png",
    "figure4.png",
    "figure5.png",
    "figure6.png",
    "figure7.png",
    "figure8.png",
    "figure9.png",
    "figure10.png",
    "figure11.png",
    "figure12.png",
    "figure13.png",
  ];

  // Preload all images and calculate sizes
  for (let i = 0; i < possible_images.length; i++) {
    let tempImg = loadImage(possible_images[i], img => {
      imgSizes[i] = getImageSize(img);
    });
    images.push(tempImg);
  }

  myFont = loadFont('Beatrice-Semibold.ttf');
}

function getImageSize(img) {
  let maxWidth = windowWidth * 0.25;
  let maxHeight = windowHeight * 0.25;

  let aspectRatio = img.width / img.height;
  let imgWidth, imgHeight;

  if (img.width > img.height) {
    imgWidth = maxWidth;
    imgHeight = maxWidth / aspectRatio;
  } else {
    imgHeight = maxHeight;
    imgWidth = maxHeight * aspectRatio;
  }

  return { width: imgWidth, height: imgHeight };
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  background(0);

  let a = 10;

  fill(255);
  textFont(myFont);
  textAlign(LEFT, TOP);

  if (isTouch) {
    // Platz rechts oben für das Schließen-X lassen
    textSize(width * 0.045);
    textLeading(width * 0.05);
    bulletList(['TOUCH to draw.', 'TAP with two fingers to change image.', 'TAP with three fingers to save image.'], a, a, width - a - 80);
  } else {
    textSize(width * 0.035);
    textLeading(width * 0.04);
    bulletList(['PRESS mouse to draw.', 'press SPACE to change image.', 'press ENTER to save image.'], a, a, width - a);
  }
}

// Zeichnet ">" als Stichpunkt, umbrochene Zeilen werden eingerückt
function bulletList(items, x, y, maxWidth) {
  let indent = textWidth('> ');

  for (let item of items) {
    text('>', x, y);

    let line = '';
    for (let word of item.split(' ')) {
      let test = line ? line + ' ' + word : word;
      if (line && textWidth(test) > maxWidth - indent) {
        text(line, x + indent, y);
        y += textLeading();
        line = word;
      } else {
        line = test;
      }
    }
    text(line, x + indent, y);
    y += textLeading();
  }
}

function draw() {
  // Auf dem Handy nur mit einem Finger zeichnen, mehrere Finger sind Gesten
  if (isTouch && (touches.length !== 1 || maxTouches > 1)) return;

  if (mouseIsPressed && images[currentImageIndex]) {
    let { width, height } = imgSizes[currentImageIndex] || { width: 100, height: 100 }; // Fallback size
    image(images[currentImageIndex], mouseX - width / 2, mouseY - height / 2, width, height);
  }
}

function keyPressed() {
  if (key === ' ') { // Spacebar changes image
    currentImageIndex = (currentImageIndex + 1) % images.length;
    return false;
  }

  if (keyCode === ENTER) { // Enter saves the image
    saveDrawing();
  }
}

function saveDrawing() {
  save('leggereZitrone.jpg');

  background(random(255), random(255), random(255));
}

function touchStarted() {
  maxTouches = max(maxTouches, touches.length);
  return false; // kein Scrollen oder Zoomen
}

function touchEnded() {
  if (touches.length > 0) return false; // warten, bis alle Finger weg sind

  if (maxTouches === 2) { // Zwei Finger wechseln das Bild
    currentImageIndex = (currentImageIndex + 1) % images.length;
  } else if (maxTouches >= 3) { // Drei Finger speichern
    saveDrawing();
  }

  maxTouches = 0;
  return false;
}
