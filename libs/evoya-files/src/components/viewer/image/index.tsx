export function ImageViewer({ path }: { path: string; }) {
  return (
    <div className="rounded-xl bg-white border flex items-center justify-center p-4">
      <img className="w-full h-full object-contain" src={path} />
    </div>
  )
}