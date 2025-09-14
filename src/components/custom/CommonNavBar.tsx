"use client";
import Link from "next/link";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink } from "../ui/navigation-menu";
import { GithubIcon, HouseIcon } from "lucide-react";

export const CommonNavMenu = () => {
    return (
        <NavigationMenu className="border-b mb-4 align-middle min-w-svw" viewport={false}>
            <NavigationMenuItem style={{ listStyle: 'none' }}>
                <NavigationMenuLink asChild>
                    <Link href="https://github.com/crazystylus/faang-sched-gen" target="_blank" rel="noopener noreferrer"><div className="flex items-center gap-4"><GithubIcon /> Github</div></Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem style={{ listStyle: 'none' }}>
                <NavigationMenuLink asChild>
                    <Link href="/"><div className="flex items-center gap-4"><HouseIcon /> Home</div></Link>
                </NavigationMenuLink>
            </NavigationMenuItem>
        </NavigationMenu>
    )
}