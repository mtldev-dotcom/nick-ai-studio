import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/gallery");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="max-w-md w-full mx-auto px-4 text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-[#00e5c9] to-[#4a9eff] bg-clip-text text-transparent font-['Rajdhani'] mb-4">
            FalStudio
          </h1>
          <p className="text-xl text-[#8898a5]">
            Persistent AI Generation Workspace
          </p>
        </div>
        <div className="mc-card mc-card-teal p-8">
          <p className="text-[#b8cfdf] mb-6">
            Generate stunning images and videos with Fal.ai. All assets are automatically saved to your private R2 bucket.
          </p>
          <a
            href="/sign-in"
            className="inline-block px-8 py-3 bg-[#00e5c9] text-[#080808] font-medium rounded-lg hover:bg-[#00e5c9]/90 transition-all"
          >
            Sign In to Start
          </a>
        </div>
      </div>
    </div>
  );
}
