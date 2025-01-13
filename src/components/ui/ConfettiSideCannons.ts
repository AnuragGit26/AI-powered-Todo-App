import confetti from "canvas-confetti";


export function ConfettiSideCannons() {
        const end = Date.now() + 3 * 1000; // 3 seconds
        const colors = ["#a786ff", "#fd8bbc", "#eca184", "#f8deb1", "#f9f871"];

        const frame = () => {
            if (Date.now() > end) return;

            confetti({
                particleCount: 1,
                angle: 60,
                spread: 55,
                startVelocity: 60,
                origin: { x: 0, y: 0.5 },
                colors: colors,
                gravity:1
            });
            confetti({
                particleCount: 1,
                angle: 120,
                spread: 55,
                startVelocity: 60,
                origin: { x: 1, y: 0.5 },
                colors: colors,
                gravity:1
            });

            requestAnimationFrame(frame);

    };
    frame();

}
