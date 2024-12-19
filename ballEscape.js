(function() {
    const canvas = document.getElementById('gameCanvasBallEscape');
    const ctx = canvas.getContext('2d');

    // Add missing canvas dimensions
    const WIDTH = 800;
    const HEIGHT = 600;
    const CENTER = { x: WIDTH / 2, y: HEIGHT / 2 };
    const RADIUS = 150;

    // Ensure the canvas has the correct size
    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    console.log(`Canvas width: ${canvas.width}, Canvas height: ${canvas.height}`);  // Log canvas size

    let isAnimating = false;

    function animate() {
        if (!isAnimating) return;  // If not animating, stop the loop.

        console.log("Animating Ball Escape...");

        ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas

        // Directly draw the circle in the animate function to test
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(CENTER.x, CENTER.y, RADIUS, 0, Math.PI * 1.9);
        ctx.stroke();
        ctx.closePath();

        requestAnimationFrame(animate);  // Request the next frame of the animation
    }

    document.getElementById('ballEscapeButton').addEventListener('click', function() {
        const homeScreen = document.getElementById("homeScreen");
        const gameBoxBallEscape = document.getElementById("gameBoxBallEscape");

        // Hide home screen and show the ball escape game box
        homeScreen.style.display = "none";
        gameBoxBallEscape.style.display = "inline";

        // Start the animation loop
        if (!isAnimating) {
            console.log("Starting animation...");
            isAnimating = true;
            animate();  // Start the animation
        }
    });
    
    
    

    // Add a back button handler for the ball escape game
    document.getElementById('backButtonBallEscape').addEventListener('click', function() {
        console.log("Stopping animation...");
        isAnimating = false;
        const homeScreen = document.getElementById("homeScreen");
        const gameBoxBallEscape = document.getElementById("gameBoxBallEscape");
        homeScreen.style.display = "block";
        gameBoxBallEscape.style.display = "none";
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
})();