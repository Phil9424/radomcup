"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Trophy, Users, Award, Home, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";

export function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  return (
    <nav className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="h-7 w-7 text-primary" />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Radom Cup
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Link href="/">
              <Button 
                variant={isActive("/") && pathname === "/" ? "default" : "ghost"}
                size="sm"
              >
                <Home className="mr-2 h-4 w-4" />
                Главная
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button 
                variant={isActive("/tournaments") ? "default" : "ghost"}
                size="sm"
              >
                <Trophy className="mr-2 h-4 w-4" />
                Турниры
              </Button>
            </Link>
            <Link href="/players">
              <Button 
                variant={isActive("/players") ? "default" : "ghost"}
                size="sm"
              >
                <Users className="mr-2 h-4 w-4" />
                Игроки
              </Button>
            </Link>
            <Link href="/achievements">
              <Button 
                variant={isActive("/achievements") ? "default" : "ghost"}
                size="sm"
              >
                <Award className="mr-2 h-4 w-4" />
                Достижения
              </Button>
            </Link>
            <Link href="/admin">
              <Button 
                variant={isActive("/admin") ? "default" : "ghost"}
                size="sm"
              >
                <Settings className="mr-2 h-4 w-4" />
                Админ
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
