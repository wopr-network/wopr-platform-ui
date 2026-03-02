import { HomeIcon, SearchXIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "404 — Page Not Found",
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <SearchXIcon className="size-6 text-muted-foreground" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                WOPR
              </p>
              <CardTitle className="text-xl">404</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This page doesn&apos;t exist. It may have been moved or the URL might be incorrect.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild>
            <Link href="/">
              <HomeIcon />
              Dashboard
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
