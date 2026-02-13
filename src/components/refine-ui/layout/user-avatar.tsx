import { useGetIdentity } from "@refinedev/core";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export type User = {
  id: string;
  name?: string;
  email?: string;
  avatar?: string;
};

export function UserAvatar() {
  const { data: user, isLoading: userIsLoading } = useGetIdentity<User>();

  if (userIsLoading || !user) {
    return <Skeleton className={cn("h-10", "w-10", "rounded-full")} />;
  }

  const { name = "", avatar } = user;

  console.log("IDENTITY:", user);

  return (
    <Avatar className={cn("h-10", "w-10")}>
      <AvatarImage
        src={
          avatar
            ? avatar
            : "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3396.jpg?semt=ais_wordcount_boost&w=740&q=80"
        }
        alt={name}
      />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}

const getInitials = (name = "") => {
  const names = name.split(" ");
  let initials = names[0]?.substring(0, 1).toUpperCase() ?? "";

  if (names.length > 1) {
    initials += names[names.length - 1]?.substring(0, 1).toUpperCase() ?? "";
  }
  return initials;
};

UserAvatar.displayName = "UserAvatar";
