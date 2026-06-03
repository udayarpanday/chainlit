export function AudioPlayer({ path }: { path: string; }) {
  return (
    <div className="rounded-xl bg-white border flex items-center justify-center p-4">
      <audio controls className="w-full" preload="metadata" src={path}>
          Your browser does not support the audio element.
      </audio>
    </div>
  )
}