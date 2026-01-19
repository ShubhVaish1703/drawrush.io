import Lobby from "@/components/HomePage/Lobby";
import { Suspense } from 'react'


export default function Home() {
  return (
    <Suspense fallback={<div></div>}>
      <div>
        <Lobby />
      </div>
    </Suspense>
  );
}



