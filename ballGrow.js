// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = 800;
const HEIGHT = 600;
const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
const RADIUS = 150;

canvas.width = WIDTH;
canvas.height = HEIGHT;

let isAnimating = false;

let gravDisplay = document.getElementById('grav')
let bounceDisplay = document.getElementById('bounce')
let sizeDisplay = document.getElementById('size')
let ballGravity = 0.4
let bounce = 2.01
let sizeGain = 0.5
let numBalls = 0

let hasTail = false;

let hasInputSound = false;
let hasInputImage = false;
let inputFile;
let inputImage = [];

let audio = null

let isSoundPlaying = false;

let soundTimer = null; // Timer for collision sound
const soundCooldown = 200; // Cooldown period in milliseconds

function playCollisionSoundWithGlobalReset() {
    if (audio && hasInputSound) {
        if (!isSoundPlaying) {
            isSoundPlaying = true; // Set the flag to prevent overlaps
            audio.currentTime = 0; // Reset to start
            audio.play().catch((error) => console.error('Error playing sound:', error));

            // Reset the sound after the full cooldown period
            soundTimer = setTimeout(() => {
                isSoundPlaying = false; // Allow the next sound to play
                audio.pause();
            }, soundCooldown);
        } else {
            // Reset the timer if another collision happens
            if (soundTimer) {
                clearTimeout(soundTimer);
            }
            soundTimer = setTimeout(() => {
                isSoundPlaying = false;
            }, soundCooldown);
        }
    }
}

function stopSound() {
    if(audio != null) {
        audio.pause()
    }
}


// Ball class
class Ball {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = { 
            r: Math.random() * 255, 
            g: Math.random() * 255, 
            b: Math.random() * 255 
        };
        this.vx = Math.random() * 0.5 + 0.5;
        this.vy = Math.random() * 0.5 + 0.5;
        this.gravity = ballGravity;
        this.colorChnage = {
            r: 1,
            g: 1,
            b: 1
        };
        this.image = null;
    }

    loadImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = imageUrl;
        });
    }

    draw(ctx) {
        if(this.color.r >= 255 || this.color.r <= 0) {
            this.colorChnage.r *= -1;
        }
        if(this.color.g >= 255 || this.color.g <= 0) {
            this.colorChnage.g *= -1;
        }
        if(this.color.b >= 255 || this.color.b <= 0) {
            this.colorChnage.b *= -1;
        }

        this.color.r += this.colorChnage.r;
        this.color.g += this.colorChnage.g;
        this.color.b += this.colorChnage.b;

        ctx.fillStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "white";
        ctx.stroke();
        ctx.closePath();

        if (this.image) {
            // Calculate image drawing dimensions
            const imgSize = this.radius * 2;
            ctx.drawImage(
                this.image, 
                this.x - this.radius, 
                this.y - this.radius, 
                imgSize, 
                imgSize
            );
        }
    }

    move() {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        // Bounce if hitting the circular boundary
        const dx = this.x - CENTER.x;
        const dy = this.y - CENTER.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance + this.radius > RADIUS) {
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            const nx = dx / magnitude;
            const ny = dy / magnitude;

            const dotProduct = this.vx * nx + this.vy * ny;
            this.vx -= bounce * dotProduct * nx;
            this.vy -= bounce * dotProduct * ny;

            // Slightly move the ball back inside the circle
            const overlap = distance + this.radius - RADIUS;
            this.x -= nx * overlap;
            this.y -= ny * overlap;

            this.radius += sizeGain; // Increase radius on collision
        }
        for (let i = 0; i < balls.length; i++) {
            const ball = balls[i];
            for (let j = i + 1; j < balls.length; j++) {
                const other = balls[j];
    
                // Calculate distance between the two balls
                const dx = ball.x - other.x;
                const dy = ball.y - other.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
    
                // Check if the balls are overlapping
                if (distance < ball.radius + other.radius) {
                    if (hasInputSound) {
                        playCollisionSoundWithGlobalReset();
                    }
                    // Calculate the normal vector
                    const nx = dx / distance;
                    const ny = dy / distance;
    
                    // Calculate relative velocity
                    const dvx = ball.vx - other.vx;
                    const dvy = ball.vy - other.vy;
    
                    // Calculate the velocity along the normal
                    const dotProduct = dvx * nx + dvy * ny;
    
                    // Skip if balls are already moving apart
                    if (dotProduct > 0) {
                        continue;
                    }
    
                    // Reflect velocities (simple elastic collision)
                    ball.vx -= dotProduct * nx;
                    ball.vy -= dotProduct * ny;
                    other.vx += dotProduct * nx;
                    other.vy += dotProduct * ny;
    
                    // Resolve overlap by moving balls apart
                    const overlap = 0.5 * (ball.radius + other.radius - distance);
                    ball.x += nx * overlap;
                    ball.y += ny * overlap;
                    other.x -= nx * overlap;
                    other.y -= ny * overlap;
                    }
            }
        }
    }
}

// Ball array
const balls = [];

// Draw circle boundary
function drawBoundary() {
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(CENTER.x, CENTER.y, RADIUS, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
}

// Add a new ball
function addBall() {
    const x = CENTER.x + Math.random() * 160 -100;
    const y = CENTER.y - 100;

    const ball = new Ball(x, y, 5);

    if(hasInputImage && inputImage.length > 0) {
        const imageIndex = numBalls % inputImage.length;
        ball.loadImage(inputImage[imageIndex]).catch(error => console.error('Failed to load ball image:', error));
    }
    numBalls++;
    balls.push(ball);
}

// Animation loop
function animate() {
    if (!isAnimating) return;

    if(!hasTail) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    drawBoundary();
    balls.forEach((ball) => {
        ball.move();
        ball.draw(ctx);
        if(ball.radius > 200) {
            balls.length = 0;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    });

    requestAnimationFrame(animate);
}

function reset() {
    ballGravity = 0.4
    bounce = 2.01
    sizeGain = 0.5
    stopSound();
    gravDisplay.innerText = "Gravity: " + ballGravity.toFixed(1);
    bounceDisplay.innerText = "Bounce gain: " + (bounce-2).toFixed(2); 
    sizeDisplay.innerText = "Size gain: " + sizeGain.toFixed(1); 

    balls.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function preloadImages(imageUrls) {
    return Promise.all(
        imageUrls.map(
            (url) =>
                new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = url;
                })
        )
    );
}



// Event listener for adding a ball on click
document.getElementById('addBall').addEventListener('click', () => {
    addBall();
});

// Start animation
document.getElementById('ballGrowButton').addEventListener('click', function() {
    gravDisplay.innerText = "Gravity: " + ballGravity.toFixed(1); 
    bounceDisplay.innerText = "Bounce gain: " + (bounce-2).toFixed(2); 
    sizeDisplay.innerText = "Size gain: " + sizeGain.toFixed(1);  
    const homeScreen = document.getElementById("homeScreen");
    const gameBox = document.getElementById("gameBox");
    homeScreen.style.display = "none";
    gameBox.style.display = "inline";
    if (!isAnimating) {
        isAnimating = true;
        animate(); 
    }
});

document.getElementById('backButton').addEventListener('click', function() {
    stopSound();
    isAnimating = false
    const homeScreen = document.getElementById("homeScreen");
    const gameBox = document.getElementById("gameBox");
    homeScreen.style.display = "block";
    gameBox.style.display = "none";
    balls.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById('reset').addEventListener('click', function() {
    reset();
});

document.getElementById('gravUp').addEventListener('click', function () {
    let gravity;
    balls.forEach((ball) => {
        ball.gravity += 0.1;
        gravity = ball.gravity;
    });
    ballGravity += 0.1
    gravDisplay.innerText = "Gravity: " + ballGravity.toFixed(1); 
});

document.getElementById('gravDown').addEventListener('click', function () {
    let gravity;
    balls.forEach((ball) => {
        ball.gravity = Math.max(0, ball.gravity - 0.1);
        gravity = ball.gravity;
    });
    ballGravity = Math.max(0, ballGravity - 0.1);
    gravDisplay.innerText = "Gravity: " + ballGravity.toFixed(1); 
});

document.getElementById('bounceUp').addEventListener('click', function () {
    bounce += 0.01
    bounceDisplay.innerText = "Bounce gain: " + (bounce-2).toFixed(2); 
});

document.getElementById('bounceDown').addEventListener('click', function () {
    bounce = Math.max(1.5, bounce - 0.01);
    bounceDisplay.innerText = "Bounce gain: " + (bounce-2).toFixed(2); 
});

document.getElementById('sizeUp').addEventListener('click', function () {
    sizeGain += 0.1
    sizeDisplay.innerText = "Size gain: " + sizeGain.toFixed(1); 
});

document.getElementById('sizeDown').addEventListener('click', function () {
    sizeGain = Math.max(-5, sizeGain - 0.1);
    sizeDisplay.innerText = "Size gain: " + sizeGain.toFixed(1); 
});

document.getElementById('soundButton').addEventListener('click', () => {
    const fileInput = document.getElementById('soundInput');
    const file = fileInput.files[0];
    const button = document.getElementById('soundButton');

    if (file) {
        const fileURL = URL.createObjectURL(file);

        // Stop and reset the current audio if already playing
        if (audio) {
            audio.pause();
            audio.currentTime = 0; // Reset playback to the start
        }

        // Create a new Audio instance and set its source
        audio = new Audio(fileURL);
        hasInputSound = true;

        // Provide visual feedback
        button.style.backgroundColor = "green";
        button.innerText = "Sound Uploaded!";

        // Reset after a short delay
        setTimeout(() => {
            button.style.backgroundColor = "#333";
            button.innerText = "Submit";
        }, 1500);

        console.log(`Sound file loaded: ${file.name}`);
    } else {
        hasInputSound = false;

        // Error feedback
        button.style.backgroundColor = "red";
        button.innerText = "No File Selected!";

        setTimeout(() => {
            button.style.backgroundColor = "#333";
            button.innerText = "Submit";
        }, 1500);

        console.log('No sound file selected.');
    }
});



document.getElementById('imageButton').addEventListener('click', () => {
    const imageInput = document.getElementById('imageInput');
    const files = imageInput.files; 
    const button = document.getElementById('imageButton');

    if (files.length > 0) {
        hasInputImage = true;

        // Clear the existing images
        inputImage = [];

        // Store image URLs for all uploaded files
        for (let i = 0; i < files.length; i++) {
            inputImage.push(URL.createObjectURL(files[i]));
        }

        // Success feedback
        button.style.backgroundColor = "green";
        button.innerText = "Images Uploaded!";

        setTimeout(() => {
            button.style.backgroundColor = "#333";
            button.innerText = "Submit";
        }, 1500);

        preloadImages(inputImage)

        console.log(`Loaded ${files.length} image(s).`);
    } else {
        hasInputImage = false;

        // Error feedback
        button.style.backgroundColor = "red";
        button.innerText = "No File Selected!";

        setTimeout(() => {
            button.style.backgroundColor = "#333";
            button.innerText = "Submit";
        }, 1500);

        console.log('No images selected.');
    }
});

document.getElementById('tail').addEventListener('click', () => {
    if(!hasTail) {
        hasTail = true
        document.getElementById('tail').innerText = "Remove Tail"
    }
    else {
        hasTail = false
        document.getElementById('tail').innerText = "Add Tail"
    }
});


