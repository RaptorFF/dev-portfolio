"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProfileAvatar({ src, initials, className = "" }) {
  const [failedSource, setFailedSource] = useState("");

  return (
    <div className={className}>
      {src && failedSource !== src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 700px) 180px, 270px"
          unoptimized
          onError={() => setFailedSource(src)}
        />
      ) : (
        initials
      )}
    </div>
  );
}
