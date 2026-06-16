import React from 'react'

interface VideoPlayerProps {
  stream: MediaStream
}

export const VideoPlayer = ({ stream }: VideoPlayerProps) => {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  
  React.useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="h-full w-full object-contain"
    />
  )
}
