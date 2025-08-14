"use client"

import Image from "next/image"

const sponsors = [
  { name: "Vercel", logo: "/vercel.svg" },
]

const mysterySponsors = [
  {
    name: "Mystery Partner",
    logo: "/internshala.jpg",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    tooltip: "Not yet sponsoring us… but maybe someday 👀"
  }
]

export function Sponsers() {
  const handleMysteryClick = (url: string) => {
    window.open(url, "_blank")
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-semibold text-center mb-12">Sponsors</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center justify-items-center">
          {/* Real sponsors */}
          {sponsors.map((sponsor, index) => (
            <div key={index} className="flex flex-col items-center group">
              <div className="w-16 h-16 mb-3 transition-transform group-hover:scale-105">
                <Image
                  src={sponsor.logo || "/placeholder.svg"}
                  alt={sponsor.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <span className="text-sm text-muted-foreground text-center">
                {sponsor.name}
              </span>
            </div>
          ))}

          {/* Mystery sponsors */}
          {mysterySponsors.map((mystery, index) => (
            <div 
              key={`mystery-${index}`} 
              className="flex flex-col items-center group cursor-pointer"
              onClick={() => handleMysteryClick(mystery.url)}
              title={mystery.tooltip}
            >
              <div className="w-16 h-16 mb-3 transition-transform group-hover:scale-105">
                <Image
                  src={mystery.logo || "/placeholder.svg"}
                  alt={mystery.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-contain opacity-60 blur-[1px] transition-all duration-300"
                />
              </div>
            </div>
          ))} 
        </div>
      </div>
    </section>
  )
}
