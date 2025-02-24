"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Play, Pause, SkipForward, SkipBack, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"

export const AudioPlayerCard: React.FC = () => {
  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [progress, setProgress] = useState(0)
  const [volume, setVolume] = useState(1)
  const audioRef = useRef<HTMLAudioElement>(null)

  const fetchAudioUrls = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/data/audio?signedUrls=true", { method: "GET" })
      const audioData = await response.json()
      if (!audioData || Object.keys(audioData).length === 0) {
        throw new Error("No audio data received")
      }
      setAudioUrls(Object.values(audioData))
      setIsLoading(false)
    } catch (error) {
      console.error("Error fetching audio URLs:", error)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying])

  const togglePlayPause = () => {
    if (audioUrls.length === 0) {
      fetchAudioUrls()
    } else {
      setIsPlaying(!isPlaying)
    }
  }

  const handlePrevious = () => {
    setCurrentTrack((prev) => (prev > 0 ? prev - 1 : audioUrls.length - 1))
  }

  const handleNext = () => {
    setCurrentTrack((prev) => (prev < audioUrls.length - 1 ? prev + 1 : 0))
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const progress = (audioRef.current.currentTime / audioRef.current.duration) * 100
      setProgress(progress)
    }
  }

  const handleVolumeChange = (newVolume: number[]) => {
    const volumeValue = newVolume[0]
    setVolume(volumeValue)
    if (audioRef.current) {
      audioRef.current.volume = volumeValue
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
      <CardContent className="p-6">
        {audioUrls.length === 0 ? (
          <div className="flex justify-center items-center h-48">
            <Button onClick={togglePlayPause} disabled={isLoading}>
              {isLoading ? "Loading..." : "Play Podcast"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-800">Now Playing</h2>
              <span className="text-sm text-gray-500">
                Track {currentTrack + 1} of {audioUrls.length}
              </span>
            </div>

            <div className="relative pt-1">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                ></div>
              </div>
            </div>

            <div className="flex justify-center space-x-4">
              <Button variant="outline" size="icon" onClick={handlePrevious}>
                <SkipBack className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={togglePlayPause}>
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <SkipForward className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-gray-500" />
              <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-full" />
            </div>
          </div>
        )}
      </CardContent>
      {audioUrls.length > 0 && (
        <audio ref={audioRef} src={audioUrls[currentTrack]} onTimeUpdate={handleTimeUpdate} onEnded={handleNext} />
      )}
    </Card>
  )
}

export default AudioPlayerCard

