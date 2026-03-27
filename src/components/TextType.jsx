import {
  createElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { gsap } from "gsap"

function TextType({
  text,
  texts,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = "",
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorClassName = "",
  cursorBlinkDuration = 0.5,
  textColors = [],
  variableSpeed,
  variableSpeedEnabled = false,
  variableSpeedMin = 60,
  variableSpeedMax = 120,
  onSentenceComplete,
  startOnVisible = false,
  reverseMode = false,
  ...props
}) {
  const [displayedText, setDisplayedText] = useState("")
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(!startOnVisible)

  const cursorRef = useRef(null)
  const visibilityRef = useRef(null)

  const textArray = useMemo(() => {
    const source = texts ?? text
    if (Array.isArray(source)) {
      return source
    }
    if (typeof source === "string") {
      return [source]
    }
    return [""]
  }, [text, texts])

  const resolvedVariableSpeed = useMemo(() => {
    if (variableSpeed && typeof variableSpeed === "object") {
      return variableSpeed
    }
    if (variableSpeedEnabled) {
      return { min: variableSpeedMin, max: variableSpeedMax }
    }
    return null
  }, [variableSpeed, variableSpeedEnabled, variableSpeedMin, variableSpeedMax])

  const getRandomSpeed = useCallback(() => {
    if (!resolvedVariableSpeed) {
      return typingSpeed
    }
    const { min, max } = resolvedVariableSpeed
    return Math.random() * (max - min) + min
  }, [resolvedVariableSpeed, typingSpeed])

  const getCurrentTextColor = () => {
    if (textColors.length === 0) {
      return "inherit"
    }
    return textColors[currentTextIndex % textColors.length]
  }

  useEffect(() => {
    if (!startOnVisible || !visibilityRef.current) {
      return undefined
    }

    const target = visibilityRef.current

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
          }
        })
      },
      { threshold: 0.1 },
    )

    observer.observe(target)
    return () => observer.disconnect()
  }, [startOnVisible])

  useEffect(() => {
    const cursorElement = cursorRef.current
    if (!showCursor || !cursorElement) {
      return undefined
    }

    gsap.killTweensOf(cursorElement)
    gsap.set(cursorElement, { opacity: 1 })
    const tween = gsap.to(cursorElement, {
      opacity: 0,
      duration: cursorBlinkDuration,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut",
    })

    return () => {
      tween.kill()
      gsap.killTweensOf(cursorElement)
    }
  }, [showCursor, cursorBlinkDuration])

  useEffect(() => {
    if (!isVisible || textArray.length === 0) {
      return undefined
    }

    let timeout
    const currentText = textArray[currentTextIndex] || ""
    const processedText = reverseMode
      ? currentText.split("").reverse().join("")
      : currentText

    const executeTypingAnimation = () => {
      if (isDeleting) {
        if (displayedText === "") {
          setIsDeleting(false)

          if (currentTextIndex === textArray.length - 1 && !loop) {
            return
          }

          if (onSentenceComplete) {
            onSentenceComplete(textArray[currentTextIndex], currentTextIndex)
          }

          setCurrentTextIndex((previous) => (previous + 1) % textArray.length)
          setCurrentCharIndex(0)
          timeout = setTimeout(() => {}, pauseDuration)
        } else {
          timeout = setTimeout(() => {
            setDisplayedText((previous) => previous.slice(0, -1))
          }, deletingSpeed)
        }
      } else if (currentCharIndex < processedText.length) {
        timeout = setTimeout(() => {
          setDisplayedText((previous) => previous + processedText[currentCharIndex])
          setCurrentCharIndex((previous) => previous + 1)
        }, resolvedVariableSpeed ? getRandomSpeed() : typingSpeed)
      } else if (textArray.length >= 1) {
        if (!loop && currentTextIndex === textArray.length - 1) {
          return
        }

        timeout = setTimeout(() => {
          setIsDeleting(true)
        }, pauseDuration)
      }
    }

    if (currentCharIndex === 0 && !isDeleting && displayedText === "") {
      timeout = setTimeout(executeTypingAnimation, initialDelay)
    } else {
      executeTypingAnimation()
    }

    return () => clearTimeout(timeout)
  }, [
    currentCharIndex,
    displayedText,
    isDeleting,
    typingSpeed,
    deletingSpeed,
    pauseDuration,
    textArray,
    currentTextIndex,
    loop,
    initialDelay,
    isVisible,
    reverseMode,
    resolvedVariableSpeed,
    getRandomSpeed,
    onSentenceComplete,
  ])

  const shouldHideCursor =
    hideCursorWhileTyping &&
    (currentCharIndex < (textArray[currentTextIndex] || "").length || isDeleting)

  return (
    <span ref={visibilityRef} className="inline-block">
      {createElement(
        Component,
        {
          className: `inline-block whitespace-pre-wrap tracking-tight ${className}`.trim(),
          ...props,
        },
        <span className="inline" style={{ color: getCurrentTextColor() || "inherit" }}>
          {displayedText}
        </span>,
        showCursor && (
          <span
            ref={cursorRef}
            className={`ml-1 inline-block opacity-100 ${shouldHideCursor ? "hidden" : ""} ${cursorClassName}`.trim()}
          >
            {cursorCharacter}
          </span>
        ),
      )}
    </span>
  )
}

export default TextType
