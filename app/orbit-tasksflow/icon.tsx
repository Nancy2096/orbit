import { ImageResponse } from "next/og"

// Favicon del segmento Orbit TasksFlow: logotipo de capas en morado
// (coincide con el degradado del login y de la barra lateral).
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 7,
          background: "linear-gradient(135deg, #6366f1 0%, #9333ea 100%)",
        }}
      >
        <svg
          width="21"
          height="21"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 2 8.5 4.5-8.5 4.5L3.5 6.5 12 2Z" />
          <path d="m3.5 12 8.5 4.5 8.5-4.5" />
          <path d="m3.5 17.5 8.5 4.5 8.5-4.5" />
        </svg>
      </div>
    ),
    { ...size }
  )
}
