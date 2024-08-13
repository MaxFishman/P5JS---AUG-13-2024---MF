let shapes = [];

function setup() {
  createCanvas(windowWidth, windowHeight);
  frameRate(30); // Adjust the frame rate for smoother animation
  for (let i = 0; i < 200; i++) {
    shapes.push(new Shape(random(width / 6, width * 5 / 6), random(height / 6, height * 5 / 6), 30));
  }
}

function draw() {
  background(255);
  let squareSize = min(width, height) * 0.8;
  let xOffset = (width - squareSize) / 2;
  let yOffset = (height - squareSize) / 2;

  // Draw a square
  stroke(0);
  fill(255);
  rect(xOffset, yOffset, squareSize, squareSize);

  // Update and display shapes inside the square
  for (let shape of shapes) {
    shape.update();
    shape.display();
    shape.checkEdges(xOffset, yOffset, squareSize);
    shape.checkMouseInteraction();
  }

  // Check for collisions and morph shapes
  for (let i = 0; i < shapes.length; i++) {
    for (let j = i + 1; j < shapes.length; j++) {
      shapes[i].checkCollision(shapes[j]);
    }
  }

  // Draw black lines connecting each shape to its nearest neighbors and the mouse
  for (let i = 0; i < shapes.length; i++) {
    shapes[i].connectToNeighbors(shapes);
    shapes[i].connectToMouse();
  }
}

class Shape {
  constructor(x, y, size) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.shapeType = this.getRandomShapeType();
    this.color = this.getRandomBrightColor();
    this.targetColor = this.getRandomBrightColor(); // Add a target color
    this.vx = random(-1, 1);
    this.vy = random(-1, 1);
    this.targetShapeType = this.shapeType;
    this.morphProgress = 0;
    this.colorChangeSpeed = random(0.01, 0.05);
    this.divisionTimer = random(200, 400);
  }

  getRandomShapeType() {
    const shapeTypes = ['weirdPolygon'];
    return random(shapeTypes);
  }

  getRandomBrightColor() {
    return color(random(100, 255), random(100, 255), random(100, 255));
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    // Change color over time
    if (this.colorChangeSpeed < 1) {
      this.colorChangeSpeed += 0.01;
    } else {
      this.colorChangeSpeed = 0;
      this.color = this.targetColor;
      this.targetColor = this.getRandomBrightColor(); // Set a new target color
    }

    this.color = lerpColor(this.color, this.targetColor, this.colorChangeSpeed);

    // Morph shapes smoothly
    if (this.morphProgress < 1) {
      this.morphProgress += 0.05;
      this.shapeType = lerpShape(this.shapeType, this.targetShapeType, this.morphProgress);
    }

    // Divide shapes over time
    this.divisionTimer--;
    if (this.divisionTimer <= 0 && this.size > 10) {
      this.divide();
    }
  }

  display() {
    fill(this.color);
    noStroke();

    switch (this.shapeType) {
      case 'weirdPolygon':
        this.drawWeirdPolygon(int(random(5, 10)), this.size);
        break;
    }
  }

  drawWeirdPolygon(sides, radius) {
    let angle = TWO_PI / sides;
    beginShape();
    for (let a = 0; a < TWO_PI; a += angle) {
      let sx = this.x + cos(a) * (radius + random(-radius * 0.5, radius * 0.5));
      let sy = this.y + sin(a) * (radius + random(-radius * 0.5, radius * 0.5));
      vertex(sx, sy);
    }
    endShape(CLOSE);
  }

  checkEdges(xOffset, yOffset, squareSize) {
    if (this.x < xOffset || this.x > xOffset + squareSize) {
      this.vx *= -1;
    }
    if (this.y < yOffset || this.y > yOffset + squareSize) {
      this.vy *= -1;
    }
  }

  checkCollision(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    if (d < this.size / 2 + other.size / 2) {
      this.targetShapeType = other.shapeType;
      this.morphProgress = 0;
    }
  }

  connectToNeighbors(shapes) {
    let maxDistance = 100;
    for (let other of shapes) {
      if (other !== this) {
        let d = dist(this.x, this.y, other.x, other.y);
        if (d < maxDistance) {
          stroke(0);
          noFill();
          beginShape();
          curveVertex(this.x, this.y);
          curveVertex((this.x + other.x) / 2 + random(-20, 20), (this.y + other.y) / 2 + random(-20, 20));
          curveVertex(other.x, other.y);
          endShape();
        }
      }
    }
  }

  connectToMouse() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < 150) { // Maximum distance for connection
      stroke(0);
      noFill();
      beginShape();
      curveVertex(this.x, this.y);
      curveVertex((this.x + mouseX) / 2 + random(-20, 20), (this.y + mouseY) / 2 + random(-20, 20));
      curveVertex(mouseX, mouseY);
      endShape();
    }
  }

  checkMouseInteraction() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < this.size * 2) { // Interaction range
      let angle = atan2(this.y - mouseY, this.x - mouseX);
      let force = map(d, 0, this.size * 2, 5, 0);
      this.vx += cos(angle) * force;
      this.vy += sin(angle) * force;
    }
  }

  explode() {
    let d = dist(mouseX, mouseY, this.x, this.y);
    if (d < this.size * 2) { // Explosion range
      let angle = random(TWO_PI);
      let force = random(5, 10);
      this.vx = cos(angle) * force;
      this.vy = sin(angle) * force;
    }
  }

  divide() {
    shapes.push(new Shape(this.x + random(-this.size, this.size), this.y + random(-this.size, this.size), this.size / 2));
    shapes.push(new Shape(this.x + random(-this.size, this.size), this.y + random(-this.size, this.size), this.size / 2));
    this.size /= 2;
    this.divisionTimer = random(200, 400);
  }
}

function lerpShape(start, end, amt) {
  if (amt >= 1) return end;
  return amt < 0.5 ? start : end;
}

function mousePressed() {
  for (let shape of shapes) {
    shape.explode();
  }
}

function keyPressed() {
  if (key === ' ') {
    saveCanvas('shapes_morph', 'png');
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}