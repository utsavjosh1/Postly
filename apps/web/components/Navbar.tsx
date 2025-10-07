"use client"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Nav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto w-full max-w-6xl px-4 py-4">
        <div className="grid grid-cols-3 items-center">
          <div className="justify-self-start text-sm md:text-base font-medium">
            <span className="select-none">Postly</span>
          </div>

          <nav aria-label="Primary" className="justify-self-center">
            <ul className="flex items-center gap-6 text-xs md:text-sm">
              <li>
                <Link href="#" className="text-foreground/90 hover:text-foreground transition-colors">
                  Discord
                </Link>
              </li>
              <li>
                <Link href="#" className="text-foreground/90 hover:text-foreground transition-colors">
                  Whatsapp
                </Link>
              </li>
            </ul>
          </nav>

          <div className="justify-self-end">
            <Button
              variant="outline"
              className="h-8 rounded-full border-foreground/30 text-foreground/90 px-4 text-xs md:text-sm bg-transparent"
            >
              Log in
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
