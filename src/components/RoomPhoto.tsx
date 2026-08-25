import { useQuery } from "@tanstack/react-query";
import { ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export function useRoomPhotoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["room-photo", path],
    enabled: Boolean(path),
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await supabase.storage
        .from("room-photos")
        .createSignedUrl(path!, 60 * 60);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  });
}

export function RoomPhoto({
  path,
  alt,
  className,
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const { data: url } = useRoomPhotoUrl(path);

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageIcon className="h-6 w-6" aria-hidden />
        <span className="sr-only">Sem foto cadastrada</span>
      </div>
    );
  }

  return <img src={url} alt={alt} loading="lazy" className={cn("object-cover", className)} />;
}
