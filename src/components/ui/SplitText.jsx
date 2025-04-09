import { useSprings, animated } from '@react-spring/web';
import { useEffect, useRef, useState } from 'react';

const SplitText = ({
                       text = '',
                       className = '',
                       delay = 100,
                       animationFrom = { opacity: 0, transform: 'translate3d(0,40px,0)' },
                       animationTo = { opacity: 1, transform: 'translate3d(0,0,0)' },
                       easing = 'ease-out',
                       threshold = 0.1,
                       rootMargin = '-100px',
                       textAlign = 'center',
                       onLetterAnimationComplete,
                   }) => {
    const words = text.split(' ').map(word => word.split(''));
    const letters = words.flat();
    const [inView, setInView] = useState(false);
    const ref = useRef();
    const animatedCount = useRef(0);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    observer.unobserve(ref.current);
                }
            },
            { threshold, rootMargin }
        );

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, [threshold, rootMargin]);

    // Convert string easing to spring config
    const getSpringConfig = (easingType) => {
        // Use spring configs instead of cubic-bezier strings
        switch (easingType) {
            case 'ease-out':
                return { tension: 170, friction: 26 };
            case 'ease-in':
                return { tension: 300, friction: 40 };
            case 'ease-in-out':
                return { tension: 210, friction: 20 };
            case 'easeOutCubic':
                return { tension: 200, friction: 20 };
            default:
                return { tension: 170, friction: 26 }; // default to ease-out
        }
    };

    const springConfig = getSpringConfig(easing);

    const springs = useSprings(
        letters.length,
        letters.map((_, i) => ({
            from: animationFrom,
            to: inView
                ? async (next) => {
                    await next(animationTo);
                    animatedCount.current += 1;
                    if (animatedCount.current === letters.length && onLetterAnimationComplete) {
                        onLetterAnimationComplete();
                    }
                }
                : animationFrom,
            delay: i * delay,
            config: springConfig,
        }))
    );

    return (
        <p
            ref={ref}
            className={`split-parent overflow-hidden inline ${className}`}
            style={{ textAlign, whiteSpace: 'normal', wordWrap: 'break-word' }}
        >
            {words.map((word, wordIndex) => (
                <span key={wordIndex} style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
          {word.map((letter, letterIndex) => {
              const index = words
                  .slice(0, wordIndex)
                  .reduce((acc, w) => acc + w.length, 0) + letterIndex;

              return (
                  <animated.span
                      key={index}
                      style={springs[index]}
                      className="inline-block transform transition-opacity will-change-transform"
                  >
                      {letter}
                  </animated.span>
              );
          })}
                    <span style={{ display: 'inline-block', width: '0.3em' }}>&nbsp;</span>
        </span>
            ))}
        </p>
    );
};

export default SplitText;