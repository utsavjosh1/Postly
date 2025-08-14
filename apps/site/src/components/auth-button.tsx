"use client";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth-provider";
import { LogIn, LogOut, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AuthButton() {
  const { user, loading, login, logout } = useAuth();

  if (loading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className="bg-slate-800/50 border-emerald-400/30 text-emerald-300"
      >
        <div className="w-4 h-4 border-2 border-emerald-300 border-t-emerald-500 rounded-full animate-spin" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button
        onClick={login}
        variant="outline"
        size="sm"
        className="gap-2 bg-slate-800/50 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-200 font-mono"
      >
        <LogIn className="w-4 h-4" />
        SIGN IN
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-slate-800/50 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400 transition-all duration-200 font-mono"
        >
          <Avatar className="w-6 h-6 border border-emerald-400/30">
            <AvatarImage
              src={user.avatar || undefined}
              alt={user.name || "User"}
            />
            <AvatarFallback className="bg-emerald-500 text-slate-900 text-xs font-bold">
              {user.name?.charAt(0).toUpperCase() || (
                <User className="w-3 h-3" />
              )}
            </AvatarFallback>
          </Avatar>
          {user.name || user.email.split("@")[0]}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-slate-900 border-emerald-400/30"
      >
        <DropdownMenuItem disabled className="text-emerald-300 font-mono">
          <User className="w-4 h-4 mr-2" />
          {user.email}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-emerald-400/30" />
        <DropdownMenuItem
          onClick={logout}
          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 font-mono"
        >
          <LogOut className="w-4 h-4 mr-2" />
          SIGN OUT
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
