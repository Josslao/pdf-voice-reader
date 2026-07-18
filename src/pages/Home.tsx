import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useStore } from "@/lib/store";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import ReaderView from "@/components/ReaderView";
import ProviderVoicePicker from "@/components/ProviderVoicePicker";
import ControlBar from "@/components/ControlBar";
import SettingsDrawer from "@/components/SettingsDrawer";

export default function Home() {
  const player = useAudioPlayer();
  const parsed = useStore((s) => s.parsed);

  return (
    <div className="flex min-h-dynamic flex-col bg-paper">
      <Header />

      <main className="mx-auto w-full max-w-[980px] flex-1 px-3 pb-44 sm:px-5 sm:pb-40">
        <Hero />

        {parsed && (
          <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:gap-5 lg:grid-cols-[1fr_320px]">
            <ReaderView
              currentIndex={player.currentIndex}
              onJump={(idx) => player.playOne(idx)}
            />
            <ProviderVoicePicker />
          </div>
        )}
      </main>

      <ControlBar player={player} />
      <SettingsDrawer />
    </div>
  );
}
